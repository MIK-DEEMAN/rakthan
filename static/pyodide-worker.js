/**
 * Web Worker ที่รัน Python ด้วย Pyodide
 *
 * ทำไมต้องเป็น Worker: ถ้ารันบน main thread โค้ดที่มีลูปไม่รู้จบจะทำให้ทั้งหน้าค้าง
 * ผู้เรียนปิดแท็บไม่ได้ด้วยซ้ำ — และผู้เรียนมือใหม่เขียนลูปไม่รู้จบกันทุกคน
 *
 * ❗ ไฟล์นี้ต้องอยู่ใน static/ ห้ามย้ายไป src/
 *
 * เหตุผล: worker ตัวนี้ต้องเป็น **module worker** เพราะโหลด Pyodide ด้วย
 * dynamic import (importScripts ใช้ไม่ได้ ดูคอมเมนต์ในฟังก์ชัน getPyodide)
 * แต่ถ้าให้ webpack bundle ให้ มันจะเขียนทับ option ที่เราส่งไปเป็น
 *     new Worker(url, Object.assign({}, {type:"module"}, {type: void 0}))
 * ซึ่งบังคับให้กลายเป็น classic worker แล้ว dynamic import จะพังทันที
 * (ตรวจพบจาก build จริงตอนไล่หาสาเหตุที่ Pyodide โหลดไม่ขึ้น)
 *
 * ไฟล์ใน static/ ถูกคัดลอกตรง ๆ ไม่ผ่าน webpack จึงคุม type ของ worker ได้เอง
 *
 * ผลข้างเคียงที่ต้องรับไว้: ไฟล์นี้ไม่ถูกตรวจด้วย TypeScript และไม่ถูก minify
 *
 * ข้อกำหนดที่ยึดไว้ (CLAUDE.md หัวข้อ 4/C2):
 *   - ห้ามใช้ SharedArrayBuffer / Atomics.wait เพราะต้องเปิด COOP+COEP ทั้งไซต์
 *     input() จึงอ่านจาก buffer ที่ผู้เรียนกรอกไว้ล่วงหน้าแทน
 *   - แยกนาฬิกาสองตัว: ตัวนี้ไม่จับเวลาเอง ฝั่ง main thread เป็นคนสั่ง terminate
 *     เพราะการโหลด Pyodide ครั้งแรกกินเวลานานกว่า timeout ของการรันโค้ดมาก
 */

// ล็อกเวอร์ชันไว้ ไม่ใช้ "latest" เพราะโปรเจกต์ต้องบิลด์ได้เหมือนเดิมอีก 5 ปี
const PYODIDE_VERSION = '314.0.3';
const INDEX_URL = `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/`;

/** แคช instance ไว้ระดับ worker — หน้าเดียวมี runner กี่ตัวก็โหลด Pyodide ครั้งเดียว */
let pyodidePromise = null;

function post(message) {
  self.postMessage(message);
}

/**
 * ตัดเฟรมที่เป็นเครื่องในของ Pyodide ออกจาก traceback
 *
 * ทำไมต้องมี: บท 0.10 สอนผู้เรียนอ่าน traceback ถ้าปล่อยให้เห็นบรรทัดอย่าง
 *   File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async
 * ผู้เรียนมือใหม่จะไปไล่หาบั๊กในไฟล์ที่ตัวเองไม่ได้เขียน และสรุปว่า Python พัง
 *
 * เก็บเฉพาะเฟรมที่มาจากโค้ดของผู้เรียนไว้ ส่วนบรรทัดสรุปข้อผิดพลาดบรรทัดสุดท้าย
 * (เช่น NameError: name 'x' is not defined) ยังอยู่ครบ เพราะนั่นคือส่วนที่ต้องอ่าน
 */
const INTERNAL_FRAME = /File "(\/lib\/python[\d.]*\.zip|.*_pyodide[/\\]).*"/;
const PRELUDE_FRAME = /File "<exec>".*in _rk_input/;

function cleanTraceback(text) {
  const lines = String(text).split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    if (INTERNAL_FRAME.test(lines[i]) || PRELUDE_FRAME.test(lines[i])) {
      // ข้ามบรรทัดโค้ดที่ตามหลังเฟรมนั้นด้วย (traceback วางคู่กันเสมอ)
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() !== '' &&
        !/^\s*File "/.test(lines[i + 1]) &&
        /^\s/.test(lines[i + 1])
      ) {
        i++;
      }
      continue;
    }
    kept.push(lines[i]);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n');
}

async function getPyodide() {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    post({ type: 'phase', phase: 'loading-runtime' });

    // ⚠️ ห้ามใช้ importScripts() ที่นี่
    // ทดสอบบน Chrome จริงกับเว็บที่ deploy แล้วพบว่า importScripts() โหลดสคริปต์
    // ข้าม origin ไม่สำเร็จ ทั้งที่ fetch() ใน worker เดียวกันโหลด URL เดิมได้ปกติ
    // (ยืนยันด้วย worker เปล่าที่ไม่มีโค้ดของโปรเจกต์นี้เลย)
    // module worker + dynamic import ทำงานได้ จึงใช้วิธีนี้แทน
    let loadPyodide;
    try {
      ({ loadPyodide } = await import(`${INDEX_URL}pyodide.mjs`));
    } catch (err) {
      // เน็ตหลุด CDN ล่ม หรือเครือข่ายของโรงเรียนบล็อก jsdelivr
      // ต้องแยกจากข้อผิดพลาดในโค้ดของผู้เรียน ไม่งั้นผู้เรียนจะนึกว่าตัวเองเขียนผิด
      const e = new Error('RK_LOAD_FAILED');
      e.rkLoadFailed = true;
      throw e;
    }

    const py = await loadPyodide({ indexURL: INDEX_URL });
    post({ type: 'phase', phase: 'runtime-ready' });
    return py;
  })();

  // ถ้าโหลดพลาด ต้องล้างแคชทิ้ง ไม่งั้นกด "รัน" ใหม่จะได้ error เดิมค้างตลอดไป
  pyodidePromise.catch(() => {
    pyodidePromise = null;
  });

  return pyodidePromise;
}

/**
 * แทนที่ input() ให้อ่านจาก buffer ทีละบรรทัด
 * และ echo สิ่งที่อ่านไปลง stdout เพื่อให้ผู้เรียนเห็นว่าโปรแกรมรับอะไรเข้าไป
 */
const STDIN_PRELUDE = `
import builtins as _rk_builtins

_rk_lines = iter(_RK_STDIN.split("\\n") if _RK_STDIN else [])

def _rk_input(prompt=""):
    try:
        line = next(_rk_lines)
    except StopIteration:
        # "from None" สำคัญมาก — ถ้าไม่ใส่ Python จะพ่วง StopIteration ขึ้นมาก่อน
        # พร้อมข้อความ "During handling of the above exception..." ซึ่งบังข้อความไทย
        # ที่เราตั้งใจเขียนให้ผู้เรียนอ่าน แล้วผู้เรียนจะไปไล่หา StopIteration แทน
        raise EOFError(
            "โปรแกรมเรียก input() แต่ช่องอินพุตไม่มีข้อมูลเหลือแล้ว\\n"
            "ให้เติมข้อมูลในช่อง \\"อินพุต\\" เพิ่มอีกหนึ่งบรรทัด แล้วกดรันใหม่"
        ) from None
    print(str(prompt) + line)
    return line

_rk_builtins.input = _rk_input
`;

self.onmessage = async (event) => {
  const { type, code, stdin, packages } = event.data ?? {};
  if (type !== 'run') return;

  let stdout = '';
  let stderr = '';

  try {
    const py = await getPyodide();

    if (Array.isArray(packages) && packages.length > 0) {
      post({ type: 'phase', phase: 'loading-packages', packages });
      await py.loadPackage(packages, {
        messageCallback: (m) => post({ type: 'log', message: String(m) }),
        errorCallback: (m) => post({ type: 'log', message: String(m) }),
      });
    }

    post({ type: 'phase', phase: 'running' });

    py.setStdout({ batched: (s) => { stdout += `${s}\n`; } });
    py.setStderr({ batched: (s) => { stderr += `${s}\n`; } });

    py.globals.set('_RK_STDIN', typeof stdin === 'string' ? stdin : '');
    await py.runPythonAsync(STDIN_PRELUDE);

    await py.runPythonAsync(code);

    post({ type: 'result', ok: true, stdout, stderr });
  } catch (err) {
    if (err && err.rkLoadFailed) {
      // ไม่ใช่ความผิดของผู้เรียน — ฝั่ง UI จะแสดงข้อความคนละแบบ
      post({ type: 'result', ok: false, loadFailed: true, stdout: '', stderr: '' });
    } else {
      // Pyodide ใส่ traceback ของ Python ไว้ใน message อยู่แล้ว ส่งต่อทั้งก้อน
      // เพื่อให้ผู้เรียนได้ฝึกอ่าน traceback จริง (บท 0.10)
      post({
        type: 'result',
        ok: false,
        stdout,
        stderr: cleanTraceback(stderr + (err && err.message ? err.message : String(err))),
      });
    }
  } finally {
    try {
      const py = await pyodidePromise;
      py.setStdout({});
      py.setStderr({});
    } catch {
      /* ไม่ต้องทำอะไร — ถ้าโหลด Pyodide ไม่สำเร็จตั้งแต่แรกก็ไม่มีอะไรให้คืนค่า */
    }
  }
};
