import { useId, useState, type ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * <BinaryConverter> — เครื่องมือแปลงเลขฐาน 10 / 2 / 16 (C5 ใน CLAUDE.md หัวข้อ 4)
 *
 * ```mdx
 * <BinaryConverter initialValue={43} />
 * ```
 *
 * สิ่งที่ตั้งใจให้ผู้เรียนเห็น:
 *   1. เลขเดียวกันเขียนได้หลายฐาน แต่ "จำนวน" ไม่ได้เปลี่ยน — เปลี่ยนแค่วิธีเขียน
 *   2. แต่ละบิตมีค่าประจำหลักของตัวเอง และจำนวนคือผลรวมของหลักที่เป็น 1
 *   3. จำนวนบิตจำกัด แปลว่าค่าที่เก็บได้มีเพดาน — เป็นประตูไปสู่เรื่อง overflow
 *
 * กดสลับบิตได้ทั้งด้วยเมาส์และคีย์บอร์ด และทุกบิตมี aria-label บอกสถานะ
 * เพราะห้ามสื่อความหมายด้วยสีอย่างเดียว (CLAUDE.md หัวข้อ 8)
 */

export interface BinaryConverterProps {
  /** ค่าเริ่มต้น */
  initialValue?: number;
  /** จำนวนบิต (ค่าเริ่มต้น 8) */
  bits?: number;
}

export default function BinaryConverter({
  initialValue = 0,
  bits = 8,
}: BinaryConverterProps): ReactNode {
  const maxValue = 2 ** bits - 1;
  const [value, setValue] = useState(() =>
    Math.max(0, Math.min(maxValue, Math.floor(initialValue))),
  );
  /** ข้อความเตือนตอนพิมพ์ค่าที่เก็บไม่ได้ — ไม่ใช่ error แต่เป็นบทเรียน */
  const [notice, setNotice] = useState('');
  /** เก็บสิ่งที่ผู้เรียนพิมพ์ค้างไว้ เพื่อไม่ให้ช่องกระตุกระหว่างพิมพ์ */
  const [editing, setEditing] = useState<'dec' | 'bin' | 'hex' | null>(null);
  const [draft, setDraft] = useState('');

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const binary = value.toString(2).padStart(bits, '0');

  const commit = (next: number, source: 'dec' | 'bin' | 'hex', raw: string) => {
    if (Number.isNaN(next)) {
      setNotice('ยังไม่ใช่ตัวเลขที่อ่านได้ในฐานนี้');
      return;
    }
    if (next > maxValue) {
      setNotice(
        `${bits} บิตเก็บได้สูงสุด ${maxValue} — ค่าที่ใส่มาเกินเพดานนี้ จึงเก็บไม่ได้`,
      );
      return;
    }
    if (next < 0) {
      setNotice('ตัวแปลงนี้รองรับเฉพาะจำนวนที่ไม่ติดลบ (จำนวนลบเก็บยังไง อยู่ใน Stage 1)');
      return;
    }
    setNotice('');
    setValue(next);
    setEditing(source);
    setDraft(raw);
  };

  const toggleBit = (index: number) => {
    // index 0 = บิตซ้ายสุด (ค่าประจำหลักมากที่สุด)
    const power = bits - 1 - index;
    setValue((v) => v ^ (1 << power));
    setNotice('');
    setEditing(null);
  };

  const shown = (field: 'dec' | 'bin' | 'hex', fallback: string) =>
    editing === field ? draft : fallback;

  // แจกแจงว่าจำนวนนี้มาจากหลักไหนบ้าง เช่น 32 + 8 + 2 + 1
  const parts: number[] = [];
  for (let i = 0; i < bits; i++) {
    if (binary[i] === '1') parts.push(2 ** (bits - 1 - i));
  }

  return (
    <div className={styles.converter}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-dec`}>
            ฐาน 10 <span className={styles.hint}>ที่เราใช้กันทุกวัน</span>
          </label>
          <input
            id={`${uid}-dec`}
            className={styles.input}
            inputMode="numeric"
            value={shown('dec', String(value))}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === '') { setEditing('dec'); setDraft(''); setNotice(''); return; }
              commit(/^\d+$/.test(raw) ? Number(raw) : NaN, 'dec', raw);
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-bin`}>
            ฐาน 2 <span className={styles.hint}>ที่เครื่องใช้</span>
          </label>
          <input
            id={`${uid}-bin`}
            className={`${styles.input} ${styles.mono}`}
            value={shown('bin', binary)}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === '') { setEditing('bin'); setDraft(''); setNotice(''); return; }
              commit(/^[01]+$/.test(raw) ? parseInt(raw, 2) : NaN, 'bin', raw);
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-hex`}>
            ฐาน 16 <span className={styles.hint}>ทางลัดของฐาน 2</span>
          </label>
          <input
            id={`${uid}-hex`}
            className={`${styles.input} ${styles.mono}`}
            value={shown('hex', value.toString(16).toUpperCase())}
            onChange={(e) => {
              const raw = e.target.value.trim().replace(/^0[xX]/, '');
              if (raw === '') { setEditing('hex'); setDraft(''); setNotice(''); return; }
              commit(/^[0-9a-fA-F]+$/.test(raw) ? parseInt(raw, 16) : NaN, 'hex', raw);
            }}
          />
        </div>
      </div>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <p className={styles.gridLabel} id={`${uid}-bits`}>
        กดที่บิตเพื่อสลับระหว่าง 0 กับ 1
      </p>

      <div className={styles.grid} role="group" aria-labelledby={`${uid}-bits`}>
        {binary.split('').map((bit, i) => {
          const weight = 2 ** (bits - 1 - i);
          return (
            <button
              type="button"
              key={`${uid}-bit-${bits - 1 - i}`}
              className={`${styles.bit} ${bit === '1' ? styles.bitOn : styles.bitOff}`}
              onClick={() => toggleBit(i)}
              aria-pressed={bit === '1'}
              aria-label={`ค่าประจำหลัก ${weight} ตอนนี้เป็น ${bit}`}
            >
              <span className={styles.bitValue}>{bit}</span>
              <span className={styles.bitWeight} aria-hidden="true">
                {weight}
              </span>
            </button>
          );
        })}
      </div>

      <p className={styles.sum} aria-live="polite">
        {parts.length === 0 ? (
          <>ทุกหลักเป็น 0 จำนวนจึงเป็น <strong>0</strong></>
        ) : (
          <>
            {parts.join(' + ')} = <strong>{value}</strong>
          </>
        )}
      </p>
    </div>
  );
}
