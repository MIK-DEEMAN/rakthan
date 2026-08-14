#!/usr/bin/env node
/**
 * ตรวจว่า bundle ยังไม่บวมกลับไปเป็นแบบเดิม — ต้องรัน **หลัง** npm run build
 *
 * ตรวจสองเรื่อง:
 *
 * 1. ต้องไม่มี chunk ชื่อ common.*.js
 *    Docusaurus ตั้ง cacheGroup ชื่อ "common" ให้ยกโมดูลที่ใช้ร่วมกันหลาย chunk
 *    ออกมาเป็นก้อนเดียว พอมี mermaid อยู่ในโปรเจกต์ dependency ของมัน (d3 ฯลฯ)
 *    ถูกยกออกมาด้วย กลายเป็นก้อน ~141KB (gzip) ที่ **ทุกหน้าต้องโหลด**
 *    แม้หน้านั้นไม่มีไดอะแกรมเลย
 *    ป้องกันไว้ด้วย plugin rk-bundle-tuning ใน docusaurus.config.ts
 *
 * 2. ต้องไม่มีสำเนาไฟล์ฟอนต์ที่มี hash ใน assets/fonts/
 *    ถ้ามี แปลว่ามีคนย้าย @font-face กลับเข้า src/ ทำให้เว็บส่งฟอนต์ซ้ำสองชุด
 *    และ <link rel="preload"> ชี้คนละไฟล์กับที่ CSS เรียก
 *
 * ทั้งสองเรื่องนี้เคยเกิดขึ้นจริงและถูกจับได้ตอนตรวจเว็บที่ deploy แล้ว
 * ไม่ใช่ปัญหาสมมติ — ดู CLAUDE.md หัวข้อ 3.2 และ 9
 *
 * รัน: npm run check:bundle   (หรือให้ CI รันหลัง build)
 */

import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'build');
const JS_DIR = join(BUILD, 'assets/js');

if (!existsSync(BUILD)) {
  console.error('❌ ไม่พบโฟลเดอร์ build/ — ต้องรัน npm run build ก่อน');
  process.exit(1);
}

const errors = [];

// ── 1. chunk "common" ต้องไม่มี ────────────────────────────
const commonChunks = existsSync(JS_DIR)
  ? readdirSync(JS_DIR).filter((f) => /^common\..*\.js$/.test(f))
  : [];

if (commonChunks.length) {
  const sizes = commonChunks
    .map((f) => {
      const kb = Math.round(gzipSync(readFileSync(join(JS_DIR, f))).length / 1024);
      return `${f} (${kb} KB gzip)`;
    })
    .join(', ');
  errors.push(
    `พบ chunk "common" ที่ทุกหน้าต้องโหลด: ${sizes}\n` +
      '    สาเหตุที่เป็นไปได้:\n' +
      '      - มีคนติดตั้ง @docusaurus/theme-mermaid กลับเข้ามา\n' +
      '      - มีคนลบหรือแก้ plugin rk-bundle-tuning ใน docusaurus.config.ts\n' +
      '      - มี dependency หนักตัวใหม่ที่ต้องเพิ่มเข้าไปในรายการ HEAVY ของ plugin นั้น\n' +
      '    ดู CLAUDE.md หัวข้อ 9',
  );
}

// ── 2. สำเนาฟอนต์ที่ถูก hash ต้องไม่มี ─────────────────────
const hashedFontsDir = join(BUILD, 'assets/fonts');
if (existsSync(hashedFontsDir)) {
  const files = readdirSync(hashedFontsDir).filter((f) => /\.(woff2?|ttf)$/.test(f));
  if (files.length) {
    errors.push(
      `พบสำเนาไฟล์ฟอนต์ที่ถูก hash ${files.length} ไฟล์ใน assets/fonts/\n` +
        '    แปลว่ามีคนย้าย @font-face กลับเข้า src/ — ต้องอยู่ที่ static/fonts/fonts.css\n' +
        '    ผลคือเว็บส่งฟอนต์ซ้ำสองชุด และ preload ชี้คนละไฟล์กับที่ CSS เรียก\n' +
        '    ดู CLAUDE.md หัวข้อ 3.2',
    );
  }
}

// ── รายงาน ──────────────────────────────────────────────────
const totalJs = existsSync(JS_DIR)
  ? readdirSync(JS_DIR)
      .filter((f) => f.endsWith('.js'))
      .reduce((s, f) => s + statSync(join(JS_DIR, f)).size, 0)
  : 0;

console.log(`ตรวจ bundle: ไฟล์ JS ${readdirSync(JS_DIR).filter((f) => f.endsWith('.js')).length} ไฟล์ ` +
  `(รวม ${Math.round(totalJs / 1024)} KB ก่อนบีบอัด — หน้าเดียวโหลดแค่บางส่วน)`);

if (errors.length) {
  console.error(`\n❌ พบปัญหา ${errors.length} จุด:\n`);
  for (const e of errors) console.error(`  ${e}\n`);
  process.exit(1);
}

console.log('✅ ไม่มี chunk "common" และไม่มีฟอนต์ซ้ำ');
