#!/usr/bin/env node
/**
 * สร้างไฟล์บทเรียนใหม่พร้อมโครงมาตรฐานและไฟล์เฉลยคู่กัน
 *
 * ทำไมต้องสร้างเฉลยพร้อมกัน: ถ้าปล่อยให้ "เดี๋ยวมาเขียนทีหลัง"
 * แปลว่าไม่มีวันได้เขียน แล้วผู้เรียนที่ติดจะติดถาวร (CONTRIBUTING.md หัวข้อ 6)
 *
 * ตัวอย่าง:
 *   npm run new-lesson -- --dir stage-0-foundations --num 02 \
 *     --id world-of-zero-and-one --title "โลกที่มีแค่ 0 กับ 1" \
 *     --track HARD --stage 0 --difficulty 2 --duration 90 --prereq how-computers-think
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── อ่าน argument ───────────────────────────────────────────
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  args[key] = process.argv[i + 1];
}

const required = ['dir', 'num', 'id', 'title', 'track', 'stage'];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error(`ขาด argument: ${missing.map((m) => '--' + m).join(', ')}\n`);
  console.error('ตัวอย่าง:');
  console.error('  npm run new-lesson -- --dir stage-0-foundations --num 02 \\');
  console.error('    --id world-of-zero-and-one --title "โลกที่มีแค่ 0 กับ 1" \\');
  console.error('    --track HARD --stage 0 --difficulty 2 --duration 90 \\');
  console.error('    --prereq how-computers-think');
  process.exit(1);
}

const {
  dir, num, id, title, track, stage,
  difficulty = '2', duration = '90', prereq = '',
  slug = id,
} = args;

const prereqList = prereq ? prereq.split(',').map((s) => s.trim()).filter(Boolean) : [];
const today = new Date().toISOString().slice(0, 10);

// slug ต้องขึ้นต้นด้วย / ไม่งั้น Docusaurus เอาชื่อโฟลเดอร์มาต่อหน้า
// แล้วย้ายบทข้ามโฟลเดอร์เมื่อไหร่ URL เปลี่ยนเมื่อนั้น (ดู CLAUDE.md หัวข้อ 7)
const slugPath = slug.startsWith('/') ? slug : `/${slug}`;
// ชื่อไฟล์เฉลยไม่มี / นำหน้า
const slugBase = slugPath.slice(1);
const lessonPath = join(ROOT, 'docs', dir, `${num}-${id}.mdx`);
const solutionPath = join(ROOT, 'docs/appendix/solutions', `${slugBase}.mdx`);

if (existsSync(lessonPath)) {
  console.error(`มีไฟล์นี้อยู่แล้ว: ${lessonPath}`);
  process.exit(1);
}

// ── โครงบทมาตรฐาน — ลำดับหัวข้อห้ามสลับ (CONTRIBUTING.md หัวข้อ 2) ──

const lesson = `---
id: ${id}
slug: ${slugPath}
title: "${title}"
description: "TODO: เขียนคำอธิบายอย่างน้อย 20 ตัวอักษร ใช้ทำ meta description บน Google"
track: ${track}
stage: ${stage}
difficulty: ${difficulty}
duration: ${duration}
prerequisites: [${prereqList.join(', ')}]
status: draft
draft: true
last_reviewed: ${today}
---

import Callout from '@site/src/components/Callout';
import PythonRunner from '@site/src/components/PythonRunner';
import Quiz from '@site/src/components/Quiz';

# ${title}

## จบบทนี้แล้วคุณจะ...

- TODO: กริยาที่วัดผลได้ เช่น "แปลงเลขฐาน 10 เป็นฐาน 2 ได้"
- TODO:
- TODO:

## ก่อนเริ่ม — ทวนของเก่า

{/* ดึงจากบทที่เรียนไปแล้ว 3-8 บทก่อนหน้า ไม่ใช่บทที่แล้ว
    ความยากพอดี ๆ ในการนึกออกคือสิ่งที่ทำให้จำได้ */}

<Quiz
  question="TODO: คำถามจากบทก่อนหน้า"
  options={[
    { text: 'TODO', feedback: 'อธิบายว่าคิดผิดตรงไหน ไม่ใช่แค่บอกว่าผิด' },
    { text: 'TODO', correct: true, feedback: 'ถูกต้อง — เพราะ...' },
  ]}
/>

## ทำไมต้องมีสิ่งนี้

{/* เปิดด้วยสถานการณ์ที่ผู้เรียนเห็นภาพ ไม่เกิน 250 คำ
    ห้ามเปิดด้วยคำนิยาม */}

TODO

## แนวคิดหลัก

### 1. TODO

TODO

<Callout type="misconception" title="คนมักเข้าใจผิดว่า">
  TODO: ถ้าผู้เรียนอ่านบทนี้แบบผิวเผิน เขาจะสรุปผิดว่าอะไร
</Callout>

<Quiz
  question="TODO: เช็คว่าตามทันไหม"
  options={[
    { text: 'TODO', feedback: 'TODO' },
    { text: 'TODO', correct: true, feedback: 'TODO' },
  ]}
/>

### 2. TODO

TODO

## ลงมือทำ

### ขั้น 1 — ดูของที่ทำเสร็จแล้ว

<PythonRunner initialCode={\`# TODO
print("สวัสดี")\`} />

TODO: อธิบายว่าแต่ละส่วนทำอะไร

### ขั้น 2 — เติมช่องว่าง

<PythonRunner initialCode={\`# TODO: เติมให้...
print(____)\`} />

## แบบฝึกหัด

{/* ห้ามใส่เฉลยที่นี่ — เฉลยอยู่ที่ docs/appendix/solutions/${slugBase}.mdx */}

### ง่าย

ระดับนี้ต้องตรวจคำตอบเองได้ทันที (ระบุผลลัพธ์ที่ควรได้ หรือใช้ \`expectedOutput\`)

1. TODO
2. TODO
3. TODO

### กลาง

4. TODO
5. TODO
6. TODO

### ท้าทาย

7. TODO
8. TODO

→ [ดูเฉลย](/docs/appendix/solutions/${slugBase})

## เช็คก่อนไปต่อ

ถ้าตอบสามข้อนี้ไม่ได้ อย่าเพิ่งไปบทถัดไป

1. TODO → ถ้าตอบไม่ได้ กลับไปอ่าน "แนวคิดหลัก ข้อ 1"
2. TODO → กลับไปอ่าน "TODO"
3. TODO → กลับไปอ่าน "TODO"

## เชื่อมโยงต่อ

- **ย้อนไปที่:** TODO
- **จะกลับมาเจออีกทีตอน:** TODO

## อ่านเพิ่ม

- TODO
`;

const solution = `---
title: "เฉลย — ${title}"
draft: true
description: "เฉลยแบบฝึกหัดของบท ${title} พร้อมคำอธิบายวิธีคิด"
---

# เฉลย — ${title}

:::warning ลองเองให้สุดก่อน

การติดแล้วคิดต่ออีก 15 นาที ให้ผลต่อความจำมากกว่าการเปิดเฉลยทันทีมาก

:::

เฉลยอธิบาย**วิธีคิด** ไม่ใช่แค่คำตอบ

## ง่าย

### ข้อ 1

TODO

### ข้อ 2

TODO

### ข้อ 3

TODO

## กลาง

### ข้อ 4

TODO

### ข้อ 5

TODO

### ข้อ 6

TODO

## ท้าทาย

### ข้อ 7

TODO

### ข้อ 8

TODO

---

← กลับไปที่ [${title}](/docs${slugPath})
`;

mkdirSync(dirname(lessonPath), { recursive: true });
mkdirSync(dirname(solutionPath), { recursive: true });
writeFileSync(lessonPath, lesson, 'utf8');
if (existsSync(solutionPath)) {
  console.log(`(มีไฟล์เฉลยอยู่แล้ว ไม่เขียนทับ: ${solutionPath})`);
} else {
  writeFileSync(solutionPath, solution, 'utf8');
}

console.log(`สร้างแล้ว:
  บทเรียน  docs/${dir}/${num}-${id}.mdx
  เฉลย     docs/appendix/solutions/${slugBase}.mdx

ขั้นถัดไป:
  1. เติม description ใน frontmatter (บังคับ)
  2. อ่าน CONTRIBUTING.md ก่อนเริ่มเขียน
  3. เขียนเสร็จแล้วรัน npm run check`);
