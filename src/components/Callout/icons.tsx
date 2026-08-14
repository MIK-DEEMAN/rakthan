import type { ReactNode } from 'react';

/**
 * ไอคอนของ <Callout> — เขียนเป็น inline SVG ไม่พึ่ง icon library
 *
 * ทำไมต้องมีไอคอนต่างกันทุก type: CLAUDE.md หัวข้อ 8 ห้ามสื่อความหมายด้วยสีอย่างเดียว
 * ผู้เรียนที่ตาบอดสีต้องแยก "ระวัง" กับ "เคล็ดลับ" ออกจากกันได้โดยไม่ต้องเห็นสี
 *
 * ทุกไอคอนใช้ currentColor เพื่อรับสีจาก --rk-cal-{type}-icon
 * และมี aria-hidden เพราะข้อความหัวเรื่องบอกความหมายอยู่แล้ว
 * ถ้าไม่ซ่อน screen reader จะอ่านซ้ำสองรอบ
 */

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const ICONS: Record<string, ReactNode> = {
  // เครื่องหมายคำถามในวงกลม — ความเข้าใจผิด
  misconception: (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9a2.8 2.8 0 0 1 5.5.7c0 1.9-2.7 2.3-2.7 4" />
      <line x1="12" y1="17.5" x2="12" y2="17.6" />
    </svg>
  ),

  // ตัว i ในวงกลม — หมายเหตุ
  note: (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <line x1="12" y1="7.5" x2="12" y2="7.6" />
    </svg>
  ),

  // หลอดไฟ — เคล็ดลับ
  tip: (
    <svg {...base}>
      <path d="M9 18h6" />
      <path d="M10 21.5h4" />
      <path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2a6.5 6.5 0 0 0-4-11.6Z" />
    </svg>
  ),

  // สามเหลี่ยมมีเครื่องหมายตกใจ — คำเตือน
  warning: (
    <svg {...base}>
      <path d="M10.3 3.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13.5" />
      <line x1="12" y1="17" x2="12" y2="17.1" />
    </svg>
  ),

  // นาฬิกาที่มีลูกศรย้อน — เกร็ดประวัติศาสตร์
  history: (
    <svg {...base}>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <polyline points="3 3 3 8 8 8" />
      <polyline points="12 7.5 12 12 15.5 14" />
    </svg>
  ),

  // แว่นขยาย — เจาะลึก
  deepdive: (
    <svg {...base}>
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="15.6" y1="15.6" x2="21" y2="21" />
      <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
      <line x1="10.5" y1="7.5" x2="10.5" y2="13.5" />
    </svg>
  ),
};
