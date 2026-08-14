import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type { WrapperProps } from '@docusaurus/types';
import type { ReactNode } from 'react';

import TrackBadge from '@site/src/components/TrackBadge';

type Props = WrapperProps<typeof ContentType>;

/**
 * Swizzle ของ DocItem/Content — แทรก <TrackBadge> เหนือเนื้อหาทุกบทอัตโนมัติ
 *
 * ทำไมต้อง swizzle: ข้อมูลแกนวิชา/ความยาก/เวลา/บทที่ต้องเรียนก่อน อยู่ใน frontmatter
 * อยู่แล้ว ถ้าให้คนเขียนบทพิมพ์ <TrackBadge> เองทุกบท จะมีวันลืมและจะไม่ตรงกับ
 * frontmatter ในที่สุด — CLAUDE.md หัวข้อ 4/C4 จึงห้ามให้พิมพ์เอง
 *
 * เป็น wrapper ไม่ใช่ eject: ถ้า Docusaurus แก้ Content ในเวอร์ชันหน้า เราได้ของใหม่ตามไปด้วย
 */
export default function ContentWrapper(props: Props): ReactNode {
  const { frontMatter } = useDoc();
  const fm = frontMatter as {
    track?: string;
    difficulty?: number;
    duration?: number;
    prerequisites?: string[];
  };

  return (
    <>
      <TrackBadge
        track={fm.track}
        difficulty={fm.difficulty}
        duration={fm.duration}
        prerequisites={fm.prerequisites}
      />
      <Content {...props} />
    </>
  );
}
