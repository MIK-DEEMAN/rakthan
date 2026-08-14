import Link from '@docusaurus/Link';
import { useAllDocsData, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * <TrackBadge> — แถบข้อมูลบนหัวบท (C4 ใน CLAUDE.md หัวข้อ 4)
 *
 * คนเขียนบทไม่ต้องเรียกใช้เอง — ถูกแทรกอัตโนมัติจาก frontmatter
 * ผ่าน src/theme/DocItem/Content
 *
 * หมายเหตุ: CLAUDE.md เดิมเขียนว่าต้องเขียน Docusaurus plugin เพื่อทำตาราง id → url
 * แต่ Docusaurus มี useAllDocsData() ที่ให้ข้อมูลนี้อยู่แล้ว จึงไม่ต้องเพิ่ม plugin
 * (dependency ยิ่งน้อยยิ่งดี ตามหลักของโปรเจกต์)
 */

export const TRACKS = {
  PROG: { label: 'เขียนโปรแกรม', en: 'Programming', varName: 'prog' },
  MATH: { label: 'คณิตศาสตร์', en: 'Mathematics', varName: 'math' },
  HARD: { label: 'ฮาร์ดแวร์และระบบ', en: 'Hardware & Systems', varName: 'hard' },
  DATA: { label: 'ข้อมูลและ AI', en: 'Data & AI', varName: 'data' },
  NET: { label: 'เครือข่าย', en: 'Networks', varName: 'net' },
  PROF: { label: 'ทักษะวิชาชีพ', en: 'Professional', varName: 'prof' },
} as const;

export type TrackCode = keyof typeof TRACKS;

export interface TrackBadgeProps {
  track?: string;
  difficulty?: number;
  duration?: number;
  prerequisites?: string[];
}

interface DocRef {
  url: string;
  title: string;
}

/**
 * map จาก id ของบท ไปเป็น url + ชื่อบท
 *
 * ต้องใช้สองแหล่งรวมกัน:
 *   useAllDocsData()  ให้ path แต่ไม่มีชื่อบท
 *   useDocsVersion()  ให้ชื่อบท แต่ไม่มี path
 *
 * ต้องแสดง**ชื่อบท** ไม่ใช่ id — ผู้เรียนอ่าน "how-computers-think" ไม่รู้เรื่อง
 */
function useDocRefById(): Map<string, DocRef> {
  const allDocsData = useAllDocsData();
  const version = useDocsVersion();
  const map = new Map<string, DocRef>();

  for (const pluginData of Object.values(allDocsData)) {
    for (const v of pluginData.versions) {
      for (const doc of v.docs) {
        const title = version.docs?.[doc.id]?.title ?? doc.id.split('/').pop() ?? doc.id;
        const ref: DocRef = { url: doc.path, title };
        map.set(doc.id, ref);

        // frontmatter เขียน prerequisites เป็นชื่อสั้น เช่น how-computers-think
        // แต่ id จริงของ Docusaurus มี path นำหน้า เช่น stage-0-foundations/how-computers-think
        //
        // ⚠️ ไฟล์เฉลยตั้งชื่อตาม slug ของบท id จึงลงท้ายเหมือนกันเป๊ะ
        // (appendix/solutions/how-computers-think) ถ้าเอามาใส่ตารางด้วยจะชนกัน
        // แล้วลิงก์ "ควรเรียนมาก่อน" จะพาไปหน้าเฉลยแทนที่จะเป็นตัวบท
        // prerequisites อ้างถึงบทเสมอ จึงข้ามทุกอย่างใต้ appendix/
        if (doc.id.startsWith('appendix/')) continue;
        const lastSegment = doc.id.split('/').pop();
        if (lastSegment && !map.has(lastSegment)) map.set(lastSegment, ref);
      }
    }
  }
  return map;
}

function Difficulty({ level }: { level: number }): ReactNode {
  const capped = Math.max(1, Math.min(5, Math.round(level)));
  return (
    <span className={styles.item}>
      <span className={styles.itemLabel}>ความยาก</span>
      {/* ห้ามสื่อด้วยจุดสีอย่างเดียว — screen reader ต้องได้ยินเป็นข้อความ */}
      <span className={styles.dots} role="img" aria-label={`ความยาก ${capped} จาก 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            aria-hidden="true"
            className={n <= capped ? styles.dotOn : styles.dotOff}
          />
        ))}
      </span>
    </span>
  );
}

export default function TrackBadge({
  track,
  difficulty,
  duration,
  prerequisites = [],
}: TrackBadgeProps): ReactNode {
  const refById = useDocRefById();
  const trackInfo = track && track in TRACKS ? TRACKS[track as TrackCode] : null;

  // ไม่มีข้อมูลอะไรเลยก็ไม่ต้องแสดงแถบ (เช่นหน้า intro, roadmap)
  if (!trackInfo && difficulty === undefined && duration === undefined) return null;

  return (
    <aside className={styles.badge} aria-label="ข้อมูลของบทเรียน">
      <div className={styles.row}>
        {trackInfo && (
          <span
            className={styles.track}
            style={{ '--track-color': `var(--rk-track-${trackInfo.varName})` } as React.CSSProperties}
          >
            {trackInfo.label}
          </span>
        )}

        {difficulty !== undefined && <Difficulty level={difficulty} />}

        {duration !== undefined && (
          <span className={styles.item}>
            <span className={styles.itemLabel}>เวลา</span>
            <span>ประมาณ {duration} นาที</span>
          </span>
        )}
      </div>

      {prerequisites.length > 0 && (
        <p className={styles.prereq}>
          <span className={styles.itemLabel}>ควรเรียนมาก่อน</span>
          {prerequisites.map((prereqId, i) => {
            const ref = refById.get(prereqId);
            return (
              <span key={prereqId}>
                {i > 0 && ', '}
                {ref ? (
                  <Link to={ref.url}>{ref.title}</Link>
                ) : (
                  // ไม่ควรเกิดขึ้น เพราะ validate-frontmatter.mjs ตรวจไว้แล้ว
                  <span className={styles.missing}>{prereqId}</span>
                )}
              </span>
            );
          })}
        </p>
      )}
    </aside>
  );
}
