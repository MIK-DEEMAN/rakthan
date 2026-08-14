import { useId, type ReactNode } from 'react';

import { ICONS } from './icons';
import styles from './styles.module.css';

/**
 * <Callout> — กล่องเน้นข้อความ (C1 ใน CLAUDE.md หัวข้อ 4)
 *
 * ใช้ทุกบท และ CI บังคับให้ทุกบทมี type="misconception" อย่างน้อย 1 กล่อง
 *
 * ```mdx
 * <Callout type="misconception" title="คนมักเข้าใจผิดว่า">
 *   เพิ่มบิตทีละตัว จำนวนค่าที่เก็บได้จะเพิ่มขึ้นทีละสองเท่า ไม่ใช่เพิ่มทีละสอง
 * </Callout>
 * ```
 *
 * ข้อกำหนดที่ยึดไว้:
 *   - ทุก type มีไอคอนต่างกัน ห้ามแยกด้วยสีอย่างเดียว (CLAUDE.md หัวข้อ 8)
 *   - สีทั้งหมดมาจาก token --rk-cal-{type}-* ห้าม hardcode (CI ตรวจ)
 *   - deepdive พับเก็บได้ด้วย <details> ของ HTML จึงทำงานได้แม้ JS ไม่โหลด
 *   - role="note" และหัวเรื่องที่ screen reader อ่านได้
 */

export const CALLOUT_TYPES = [
  'misconception',
  'note',
  'tip',
  'warning',
  'history',
  'deepdive',
] as const;

export type CalloutType = (typeof CALLOUT_TYPES)[number];

/** หัวเรื่องเริ่มต้นของแต่ละ type — คนเขียนบทไม่ต้องพิมพ์เองทุกครั้ง */
const DEFAULT_TITLES: Record<CalloutType, string> = {
  misconception: 'คนมักเข้าใจผิดว่า',
  note: 'หมายเหตุ',
  tip: 'เคล็ดลับ',
  warning: 'ระวัง',
  history: 'เกร็ดประวัติศาสตร์',
  deepdive: 'เจาะลึก — ข้ามได้ถ้ายังไม่พร้อม',
};

export interface CalloutProps {
  type?: CalloutType;
  /** หัวเรื่อง ถ้าไม่ใส่จะใช้ค่าเริ่มต้นของ type นั้น */
  title?: ReactNode;
  children: ReactNode;
  /** deepdive เปิดค้างไว้ตั้งแต่แรกหรือไม่ (ค่าเริ่มต้นคือพับไว้) */
  open?: boolean;
}

export default function Callout({
  type = 'note',
  title,
  children,
  open = false,
}: CalloutProps) {
  const titleId = `rk-callout-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const heading = title ?? DEFAULT_TITLES[type];
  const icon = ICONS[type];

  // deepdive พับเก็บได้ ใช้ <details> ของ HTML เพื่อให้ยังกดเปิดได้แม้ JS ไม่ทำงาน
  // ครอบด้วย <aside role="note"> เพื่อไม่ให้ role ไปทับ semantics ของ disclosure
  if (type === 'deepdive') {
    return (
      <aside className={`${styles.callout} ${styles.deepdive}`} role="note">
        <details className={styles.details} open={open}>
          {/* flex container อยู่ข้างใน <summary> ไม่ใช่ที่ <summary> เอง
              เพื่อไม่ต้องเปลี่ยน display ของ summary (ดูเหตุผลใน styles.module.css) */}
          <summary className={styles.summary}>
            <span className={styles.summaryInner}>
              <span className={styles.icon}>{icon}</span>
              <span className={styles.title}>{heading}</span>
            </span>
          </summary>
          <div className={styles.body}>{children}</div>
        </details>
      </aside>
    );
  }

  return (
    <aside
      className={`${styles.callout} ${styles[type]}`}
      role="note"
      aria-labelledby={titleId}
    >
      <p className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title} id={titleId}>
          {heading}
        </span>
      </p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
