import { useLocation } from '@docusaurus/router';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * <Quiz> — คำถามตรวจความเข้าใจ (C3 ใน CLAUDE.md หัวข้อ 4)
 *
 * ```mdx
 * <Quiz
 *   question="บิต 6 ตัว แทนค่าได้กี่แบบ?"
 *   options={[
 *     { text: '12', feedback: 'นี่คือ 6×2 — ลองทบทวนว่าเพิ่มบิตแล้วจำนวนแบบคูณหรือบวก' },
 *     { text: '64', correct: true, feedback: 'ถูกต้อง — 2⁶ = 64' },
 *     { text: '36', feedback: 'นี่คือ 6² — สังเกตว่าฐานกับเลขชี้กำลังสลับที่กัน' },
 *   ]}
 * />
 * ```
 *
 * หลักการที่ยึดไว้:
 *   - ตัวลวงทุกตัวต้องมี feedback ที่บอกว่า**คิดผิดตรงไหน** ไม่ใช่แค่บอกว่าผิด
 *     ตัวลวงที่ดีคือความเข้าใจผิดที่เกิดขึ้นจริง ไม่ใช่ตัวเลขมั่ว ๆ
 *   - ตอบผิดแล้วลองใหม่ได้ไม่จำกัด — จุดประสงค์คือให้เข้าใจ ไม่ใช่ให้คะแนน
 *   - บอกถูก/ผิดด้วยไอคอน + ข้อความ ไม่ใช่สีอย่างเดียว (CLAUDE.md หัวข้อ 8)
 *   - ใช้ radio ของ HTML จริง จึงเดินด้วยลูกศรและ screen reader อ่านได้ว่า "ข้อ 2 จาก 4"
 *
 * ใช้ 3 จุดต่อบท: ต้นบท (ทวนของเก่า) กลางบท (เช็คว่าตามทัน) ท้ายบท
 * ดู CONTRIBUTING.md หัวข้อ 7
 */

export interface QuizOption {
  text: ReactNode;
  correct?: boolean;
  /** อธิบายว่าผู้เรียนคิดผิดตรงไหน — บังคับให้มีทุกตัวเลือก */
  feedback: ReactNode;
}

export interface QuizProps {
  question: ReactNode;
  options: QuizOption[];
  /** ระบุเองได้ถ้าต้องการคุม key ของ localStorage */
  id?: string;
}

/** hash สั้น ๆ ที่คงที่ ใช้ทำ key ของ localStorage โดยคนเขียนบทไม่ต้องนับลำดับเอง */
function stableHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props?.children);
  }
  return '';
}

export default function Quiz({ question, options, id }: QuizProps) {
  const { pathname } = useLocation();
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const groupName = `rk-quiz-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lessonId = pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'page';
  const storageKey = `rk-quiz-${lessonId}-${id ?? stableHash(textOf(question))}`;

  // อ่านผลเก่ากลับมา เพื่อให้ผู้เรียนที่กลับมาอ่านซ้ำเห็นว่าเคยตอบได้แล้ว
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { solved?: boolean; attempts?: number };
        setSolved(Boolean(parsed.solved));
        setAttempts(Number(parsed.attempts) || 0);
      }
    } catch {
      /* localStorage ถูกปิด (โหมดส่วนตัว) — ไม่ใช่เรื่องคอขาดบาดตาย ปล่อยผ่าน */
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: { solved: boolean; attempts: number }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* เหมือนกัน — ไม่เก็บก็ยังใช้งานได้ปกติ */
      }
    },
    [storageKey],
  );

  const choose = (index: number) => {
    setSelected(index);
    const isCorrect = Boolean(options[index]?.correct);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (isCorrect && !solved) setSolved(true);
    persist({ solved: solved || isCorrect, attempts: nextAttempts });
  };

  const chosen = selected === null ? null : options[selected];
  const chosenIsCorrect = Boolean(chosen?.correct);

  return (
    <section className={styles.quiz} aria-labelledby={`${groupName}-q`}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.question} id={`${groupName}-q`}>
          {question}
          {solved && (
            <span className={styles.solvedBadge}>
              <span aria-hidden="true">✓</span> เคยตอบถูกแล้ว
            </span>
          )}
        </legend>

        <div className={styles.options}>
          {options.map((option, index) => {
            const optionId = `${groupName}-${index}`;
            const isSelected = selected === index;
            const state = !isSelected ? '' : option.correct ? styles.optionCorrect : styles.optionWrong;
            return (
              <label key={optionId} className={`${styles.option} ${state}`} htmlFor={optionId}>
                <input
                  type="radio"
                  id={optionId}
                  name={groupName}
                  className={styles.radio}
                  checked={isSelected}
                  onChange={() => choose(index)}
                />
                <span className={styles.optionText}>{option.text}</span>
                {isSelected && (
                  <span className={styles.mark} aria-hidden="true">
                    {option.correct ? '✓' : '✕'}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* aria-live เพื่อให้ screen reader อ่าน feedback ทันทีที่เลือก */}
      <div className={styles.feedbackArea} aria-live="polite">
        {chosen && (
          <div className={chosenIsCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
            <p className={styles.feedbackTitle}>
              <span aria-hidden="true">{chosenIsCorrect ? '✓' : '✕'}</span>{' '}
              {chosenIsCorrect ? 'ถูกต้อง' : 'ยังไม่ใช่ — ลองอีกครั้ง'}
            </p>
            <div className={styles.feedbackBody}>{chosen.feedback}</div>
          </div>
        )}
      </div>
    </section>
  );
}
