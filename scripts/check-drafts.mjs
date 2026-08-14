#!/usr/bin/env node
/**
 * คอมไพล์บทที่เป็น draft เพื่อดักข้อผิดพลาดของ MDX
 *
 * ทำไมต้องมี:
 * `docusaurus build` เป็นโหมด production ซึ่ง **ข้ามไฟล์ที่ draft: true ทั้งหมด**
 * แปลว่าบทที่ยังเขียนไม่เสร็จอาจมี MDX ที่คอมไพล์ไม่ผ่าน แล้ว CI ยังเขียวอยู่ดี
 * กว่าจะรู้ก็ตอนเลื่อนสถานะเป็น published ซึ่งอาจเป็นเดือนถัดไป
 *
 * เจอจริงตอนเขียนบท 0.2: template literal ที่ขึ้นบรรทัดใหม่ในรายการลำดับเลข
 * ทำให้ MDX พัง แต่ `npm run build` ขึ้น SUCCESS เพราะบทนั้นเป็น draft
 *
 * วิธีตรวจ: สั่ง dev server (ซึ่งคอมไพล์ draft ด้วย) แล้วรอดูผลการคอมไพล์
 * ไม่ได้เสิร์ฟหน้าเว็บจริง แค่ต้องการให้ตัวแปล MDX ทำงานครบทุกไฟล์
 *
 * รัน: npm run check:drafts
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3099;
const TIMEOUT_MS = 240_000;

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['docusaurus', 'start', '--port', String(PORT), '--no-open'],
  { cwd: ROOT, shell: process.platform === 'win32' },
);

let output = '';
let settled = false;

const finish = (code, message) => {
  if (settled) return;
  settled = true;
  clearTimeout(timer);
  // ต้องฆ่าทั้งกลุ่ม ไม่งั้น dev server จะค้างอยู่หลังสคริปต์จบ
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    /* ปิดไม่ได้ก็ปล่อย ตัว process จะตายตอนสคริปต์จบอยู่ดี */
  }
  console.log(message);
  setTimeout(() => process.exit(code), 300);
};

const timer = setTimeout(
  () => finish(1, `❌ คอมไพล์ไม่เสร็จภายใน ${TIMEOUT_MS / 1000} วินาที — น่าจะมีอะไรค้าง`),
  TIMEOUT_MS,
);

const scan = (chunk) => {
  const text = chunk.toString();
  output += text;

  // เอาสีของ terminal ออกก่อน ไม่งั้นจับคำไม่เจอ
  const plain = output.replace(/\[[0-9;]*m/g, '');

  if (/Module build failed|MDX compilation failed|compiled with \d+ errors?/.test(plain)) {
    const detail = plain
      .split('\n')
      .filter((l) => /MDX compilation failed|Cause:|"line":|Module build failed/.test(l))
      .slice(0, 8)
      .map((l) => `    ${l.trim()}`)
      .join('\n');
    finish(1, `❌ คอมไพล์ MDX ไม่ผ่าน (รวมไฟล์ที่เป็น draft)\n\n${detail}\n`);
    return;
  }

  if (/compiled successfully/.test(plain)) {
    finish(0, '✅ บททั้งหมดรวมที่เป็น draft คอมไพล์ผ่าน');
  }
};

child.stdout.on('data', scan);
child.stderr.on('data', scan);

child.on('error', (err) => finish(1, `❌ สั่ง docusaurus start ไม่สำเร็จ: ${err.message}`));
child.on('exit', (code) => {
  if (!settled) finish(code === 0 ? 0 : 1, `dev server จบก่อนคอมไพล์เสร็จ (exit ${code})`);
});
