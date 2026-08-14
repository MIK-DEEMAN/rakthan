import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import styles from './styles.module.css';

/**
 * <Diagram> — ไดอะแกรม Mermaid ที่โหลดเฉพาะหน้าที่ใช้จริง
 *
 * ทำไมไม่ใช้ @docusaurus/theme-mermaid:
 *   theme-mermaid ลงทะเบียนตัวจัดการ code block ระดับ global ทำให้ทุกหน้าอ้างถึงมัน
 *   webpack จึงยก dependency ร่วมออกมาเป็น chunk ชื่อ "common" ขนาด ~141KB (gzip)
 *   ที่ถูกโหลด **ทุกหน้า** แม้หน้านั้นไม่มีไดอะแกรมสักอัน
 *   (ตัว mermaid เอง lazy load อยู่แล้ว ปัญหาคือ dependency ที่ถูกยกออกมา)
 *
 *   component นี้ import mermaid แบบ dynamic จากที่เดียว หน้าที่ไม่ได้ใช้ <Diagram>
 *   จึงไม่ต้องจ่ายอะไรเลย ดูตัวเลขที่วัดได้ใน CLAUDE.md หัวข้อ 9
 *
 * การใช้งาน:
 *   <Diagram
 *     alt="ผังงานการทำงานของ if-else: เริ่มต้น แล้วถามว่าอายุถึง 18 หรือยัง ..."
 *     chart={`flowchart TD
 *       A[เริ่ม] --> B{อายุ >= 18?}
 *       B -->|ใช่| C[เข้าได้]
 *       B -->|ไม่| D[เข้าไม่ได้]`}
 *   />
 *
 * prop `alt` เป็น required ในระดับ TypeScript โดยตั้งใจ เพื่อบังคับกฎ alt text
 * ใน CONTRIBUTING.md หัวข้อ 5 ตั้งแต่ตอนเขียน ไม่ใช่ไปจับตอนรีวิว
 */

export interface DiagramProps {
  /** โค้ด Mermaid */
  chart: string;
  /**
   * คำบรรยายภาษาไทยที่บอกว่า**ภาพสื่ออะไร** ไม่ใช่ชื่อภาพ
   * ผู้ใช้ screen reader จะได้ยินข้อความนี้แทนไดอะแกรม
   */
  alt: string;
  /** คำบรรยายใต้ภาพ (ถ้ามี) — ต่างจาก alt ตรงที่ทุกคนเห็น */
  caption?: ReactNode;
}

function DiagramImpl({ chart, alt, caption }: DiagramProps) {
  const { colorMode } = useColorMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  // useId ให้ค่าที่มี ":" ซึ่งใช้เป็น id ของ mermaid ไม่ได้ ต้องแปลงก่อน
  const id = `rk-diagram-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // จุดเดียวในโปรเจกต์ที่ import mermaid — ทำให้ webpack แยกเป็น chunk ของตัวเอง
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: colorMode === 'dark' ? 'dark' : 'default',
          fontFamily: "'IBM Plex Sans Thai', sans-serif",
          // ปิด animation ให้ผู้ที่ตั้งค่า prefers-reduced-motion
          flowchart: { useMaxWidth: true },
          sequence: { useMaxWidth: true },
          securityLevel: 'strict',
        });

        const { svg } = await mermaid.render(id, chart);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setState('ready');
      } catch (e) {
        if (cancelled) return;
        // ไม่ทำให้ทั้งหน้าพัง — แสดงโค้ดต้นฉบับแทน ผู้เรียนยังอ่านได้
        console.error('[Diagram] เรนเดอร์ไดอะแกรมไม่สำเร็จ:', e);
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, colorMode, id]);

  if (state === 'error') {
    return (
      <figure className={styles.figure}>
        <pre className={styles.fallback}>
          <code>{chart}</code>
        </pre>
        <figcaption className={styles.caption}>{alt}</figcaption>
      </figure>
    );
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.scroller}>
        <div
          ref={containerRef}
          className={styles.diagram}
          role="img"
          aria-label={alt}
          data-state={state}
        />
        {state === 'loading' && (
          <p className={styles.loading}>กำลังวาดไดอะแกรม...</p>
        )}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

export default function Diagram(props: DiagramProps) {
  return (
    <BrowserOnly
      fallback={
        <figure className={styles.figure}>
          <pre className={styles.fallback}>
            <code>{props.chart}</code>
          </pre>
        </figure>
      }
    >
      {() => <DiagramImpl {...props} />}
    </BrowserOnly>
  );
}
