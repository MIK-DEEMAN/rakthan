import useBaseUrl from '@docusaurus/useBaseUrl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import styles from './styles.module.css';

/**
 * <PythonRunner> — รัน Python จริงในเบราว์เซอร์ของผู้เรียน (C2 ใน CLAUDE.md หัวข้อ 4)
 *
 * ```mdx
 * <PythonRunner
 *   initialCode={`name = input("ชื่อ: ")\nprint(f"สวัสดี {name}")`}
 *   stdin={'สมชาย'}
 *   expectedOutput="สวัสดี สมชาย"
 * />
 * ```
 *
 * การตัดสินใจที่สำคัญ (เหตุผลเต็มอยู่ใน CLAUDE.md หัวข้อ 4/C2):
 *
 *   1. Pyodide โหลดตอนกด "รัน" ครั้งแรกเท่านั้น ห้ามโหลดตอนเปิดหน้า
 *   2. รันใน Web Worker เพื่อให้ลูปไม่รู้จบไม่ทำให้ทั้งหน้าค้าง
 *   3. **นาฬิกาสองตัว** — จับเวลาเฉพาะตอนรันโค้ดของผู้เรียน (10 วินาที)
 *      ไม่จับตอนโหลด Pyodide หรือแพ็กเกจ เพราะบนมือถือเน็ตช้าเกิน 10 วินาทีได้ง่าย ๆ
 *      ถ้าใช้นาฬิกาเดียว ผู้เรียนจะเห็น timeout ทั้งที่โค้ดไม่มีปัญหา แล้วโทษตัวเอง
 *   4. input() อ่านจากช่อง "อินพุต" ที่กรอกไว้ล่วงหน้า ไม่ใช้ SharedArrayBuffer
 *   5. ตัวแก้โค้ดเป็น textarea ธรรมดา — screen reader ใช้ได้ และกด Escape แล้ว Tab
 *      เพื่อออกจากช่องได้ ไม่ติด tab trap
 */

type Phase =
  | 'idle'
  | 'loading-runtime'
  | 'loading-packages'
  | 'running'
  | 'done'
  | 'stopped'
  | 'timeout'
  | 'load-failed';

export interface PythonRunnerProps {
  initialCode: string;
  /** ข้อมูลตั้งต้นในช่องอินพุต ที่ input() จะอ่านทีละบรรทัด */
  stdin?: string;
  /** แพ็กเกจที่ต้องโหลดเพิ่ม เช่น ['numpy'] */
  packages?: string[];
  /** ให้ผู้เรียนแก้โค้ดได้หรือไม่ (ค่าเริ่มต้น: ได้) */
  editable?: boolean;
  /** ผลลัพธ์ที่ควรได้ ใช้ให้ผู้เรียนตรวจคำตอบเองในแบบฝึกหัดระดับง่าย */
  expectedOutput?: string;
  /** เวลาสูงสุดของการรันโค้ด (มิลลิวินาที) — ไม่รวมเวลาโหลด */
  timeout?: number;
}

const PHASE_TEXT: Record<Phase, string> = {
  idle: '',
  'loading-runtime': 'กำลังเตรียม Python... (ครั้งแรกใช้เวลาสักครู่)',
  'loading-packages': 'กำลังโหลดแพ็กเกจ...',
  running: 'กำลังรัน...',
  done: '',
  stopped: 'หยุดแล้ว',
  timeout: '',
  'load-failed': '',
};

export default function PythonRunner({
  initialCode,
  stdin = '',
  packages = [],
  editable = true,
  expectedOutput,
  timeout = 10_000,
}: PythonRunnerProps) {
  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState(stdin);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [log, setLog] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** กด Escape แล้ว Tab ถัดไปจะย้าย focus ออก แทนที่จะเติมช่องว่าง */
  const escapeArmedRef = useRef(false);

  const workerUrl = useBaseUrl('/pyodide-worker.js');
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const codeId = `rk-code-${uid}`;
  const stdinId = `rk-stdin-${uid}`;

  const wasmSupported =
    typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const killWorker = useCallback(() => {
    clearTimer();
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  // เก็บกวาดตอน component ถูกถอดออก ไม่ให้ worker ค้างอยู่เบื้องหลัง
  useEffect(() => () => killWorker(), [killWorker]);

  const busy =
    phase === 'loading-runtime' || phase === 'loading-packages' || phase === 'running';

  const run = useCallback(() => {
    if (busy) return;
    setStdout('');
    setStderr('');
    setLog('');
    setHasRun(true);
    setPhase('loading-runtime');

    // สร้าง worker ใหม่ทุกครั้ง เพื่อให้ตัวแปรจากการรันครั้งก่อนไม่ค้างมา
    // ทำให้ผลลัพธ์ที่ผู้เรียนเห็นตรงกับโค้ดที่อยู่ตรงหน้าเสมอ
    killWorker();
    // โหลด worker จาก static/ ไม่ใช่ผ่าน new URL(..., import.meta.url)
    // เพราะ webpack จะเขียนทับ { type: 'module' } เป็น { type: undefined }
    // ทำให้กลายเป็น classic worker แล้ว dynamic import ข้างในพัง
    // (เหตุผลเต็มอยู่ในหัวไฟล์ static/pyodide-worker.js)
    const worker = new Worker(workerUrl, { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data ?? {};

      if (data.type === 'phase') {
        if (data.phase === 'loading-packages') setPhase('loading-packages');
        if (data.phase === 'running') {
          setPhase('running');
          // ⏱ นาฬิกาตัวที่สอง เริ่มจับ **ตอนนี้** เท่านั้น
          // ไม่นับเวลาที่ใช้โหลด Pyodide และแพ็กเกจ
          clearTimer();
          timerRef.current = setTimeout(() => {
            killWorker();
            setPhase('timeout');
          }, timeout);
        }
        return;
      }

      if (data.type === 'log') {
        setLog((prev) => (prev ? `${prev}\n${data.message}` : data.message));
        return;
      }

      if (data.type === 'result') {
        clearTimer();
        if (data.loadFailed) {
          setPhase('load-failed');
          return;
        }
        setStdout(data.stdout ?? '');
        setStderr(data.stderr ?? '');
        setPhase('done');
      }
    };

    worker.onerror = (e) => {
      clearTimer();
      setStderr(`โหลด Python ไม่สำเร็จ: ${e.message || 'ไม่ทราบสาเหตุ'}`);
      setPhase('done');
    };

    worker.postMessage({ type: 'run', code, stdin: input, packages });
  }, [busy, code, input, packages, timeout, killWorker, workerUrl]);

  const stop = () => {
    killWorker();
    setPhase('stopped');
  };

  const reset = () => {
    killWorker();
    setCode(initialCode);
    setInput(stdin);
    setStdout('');
    setStderr('');
    setLog('');
    setHasRun(false);
    setPhase('idle');
  };

  /** Tab เติมช่องว่าง 4 ตัวเพื่อให้เขียนโค้ดสะดวก แต่ Escape แล้ว Tab จะออกจากช่อง */
  const onCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      escapeArmedRef.current = true;
      return;
    }
    if (e.key !== 'Tab') {
      escapeArmedRef.current = false;
      return;
    }
    if (escapeArmedRef.current) {
      escapeArmedRef.current = false;
      return; // ปล่อยให้ Tab ย้าย focus ตามปกติ
    }
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    const next = `${code.slice(0, start)}    ${code.slice(end)}`;
    setCode(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 4;
    });
  };

  const outputMatches =
    expectedOutput !== undefined && phase === 'done' && !stderr
      ? stdout.trim() === expectedOutput.trim()
      : null;

  // เบราว์เซอร์ที่ไม่รองรับ WASM รัน Pyodide ไม่ได้เลย — แสดงโค้ดให้อ่านแทน
  if (!wasmSupported) {
    return (
      <div className={styles.runner}>
        <pre className={styles.codeStatic}>
          <code>{initialCode}</code>
        </pre>
        <p className={styles.fallbackNote}>
          เบราว์เซอร์นี้รัน Python ไม่ได้ (ไม่รองรับ WebAssembly) — คัดลอกโค้ดไปรันที่{' '}
          <a href="https://colab.research.google.com/" target="_blank" rel="noreferrer">
            Google Colab
          </a>{' '}
          ได้
        </p>
      </div>
    );
  }

  return (
    <div className={styles.runner}>
      <label className={styles.label} htmlFor={codeId}>
        โค้ด Python
      </label>
      <textarea
        id={codeId}
        className={styles.code}
        value={code}
        readOnly={!editable}
        spellCheck={false}
        rows={Math.min(Math.max(code.split('\n').length, 3), 20)}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onCodeKeyDown}
        aria-describedby={`${codeId}-hint`}
      />
      <p id={`${codeId}-hint`} className={styles.hint}>
        {editable
          ? 'กด Tab เพื่อเว้นวรรค 4 ตัว — ถ้าต้องการออกจากช่องนี้ ให้กด Escape แล้วค่อยกด Tab'
          : 'โค้ดชุดนี้แก้ไขไม่ได้'}
      </p>

      <label className={styles.label} htmlFor={stdinId}>
        อินพุต — ข้อมูลที่ <code>input()</code> จะอ่านทีละบรรทัด
      </label>
      <textarea
        id={stdinId}
        className={styles.stdin}
        value={input}
        rows={2}
        spellCheck={false}
        onChange={(e) => setInput(e.target.value)}
        placeholder="หนึ่งบรรทัดต่อการเรียก input() หนึ่งครั้ง"
      />

      <div className={styles.actions}>
        <button type="button" className={styles.runButton} onClick={run} disabled={busy}>
          รัน
        </button>
        <button type="button" className={styles.button} onClick={stop} disabled={!busy}>
          หยุด
        </button>
        <button type="button" className={styles.button} onClick={reset}>
          รีเซ็ต
        </button>
        {busy && (
          <span className={styles.status} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            {PHASE_TEXT[phase]}
          </span>
        )}
      </div>

      {log && phase !== 'done' && <pre className={styles.log}>{log}</pre>}

      {hasRun && (
        <div className={styles.output} aria-live="polite">
          {phase === 'timeout' && (
            <p className={styles.timeout}>
              รันนานเกิน {Math.round(timeout / 1000)} วินาที เลยหยุดให้
              <br />
              สาเหตุที่พบบ่อยคือลูปที่ไม่มีทางจบ — ลองตรวจว่าเงื่อนไขของ <code>while</code>{' '}
              มีโอกาสเป็นเท็จไหม
            </p>
          )}
          {phase === 'stopped' && <p className={styles.stopped}>{PHASE_TEXT.stopped}</p>}

          {phase === 'load-failed' && (
            <div className={styles.loadFailed}>
              <p className={styles.loadFailedTitle}>
                โหลดตัว Python ไม่สำเร็จ — ไม่ใช่ความผิดของโค้ดคุณ
              </p>
              <p>
                ตัวแปลภาษา Python ต้องดาวน์โหลดจากอินเทอร์เน็ตครั้งแรก
                ลองตรวจการเชื่อมต่อแล้วกด &quot;รัน&quot; ใหม่อีกครั้ง
              </p>
              <p>
                ถ้ายังไม่ได้ เครือข่ายที่คุณใช้อาจบล็อกอยู่ — คัดลอกโค้ดไปรันที่{' '}
                <a
                  href="https://colab.research.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Colab
                </a>{' '}
                แทนได้ ผลลัพธ์เหมือนกัน
              </p>
            </div>
          )}

          {stdout && (
            <>
              <p className={styles.outputLabel}>ผลลัพธ์</p>
              <pre className={styles.stdout}>{stdout}</pre>
            </>
          )}

          {stderr && (
            <>
              <p className={`${styles.outputLabel} ${styles.errorLabel}`}>ข้อผิดพลาด</p>
              <pre className={styles.stderr}>{stderr}</pre>
            </>
          )}

          {phase === 'done' && !stdout && !stderr && (
            <p className={styles.empty}>โปรแกรมทำงานจบแล้ว แต่ไม่ได้แสดงผลอะไรออกมา</p>
          )}

          {outputMatches !== null && (
            <p className={outputMatches ? styles.pass : styles.fail}>
              <span aria-hidden="true">{outputMatches ? '✓' : '✕'}</span>{' '}
              {outputMatches
                ? 'ผลลัพธ์ตรงกับที่คาดไว้'
                : 'ผลลัพธ์ยังไม่ตรงกับที่คาดไว้ — ลองเทียบทีละบรรทัด'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
