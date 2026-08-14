#!/usr/bin/env node
/**
 * ตรวจกฎการเขียนที่เหลือ ซึ่ง frontmatter validator ตรวจไม่ได้
 *
 *   1. คำต้องห้ามที่ทำให้ผู้เรียนรู้สึกโง่ ("ง่ายมาก", "แค่นี้เอง", "ชัดเจนอยู่แล้ว")
 *   2. ทุกบทต้องมี <Callout type="misconception"> อย่างน้อย 1 กล่อง
 *   3. งบคำต่อบท (ประมาณการ — ดูหมายเหตุด้านล่าง)
 *   4. ห้าม hardcode สีนอก custom.css
 *
 * หมายเหตุเรื่องการนับคำภาษาไทย:
 *   ภาษาไทยไม่มีช่องว่างระหว่างคำ การนับคำที่แม่นยำต้องใช้ตัวตัดคำแบบพจนานุกรม
 *   ซึ่งจะต้องเพิ่ม dependency สคริปต์นี้จึงใช้การ**ประมาณ** จากจำนวนอักขระไทย
 *   หารด้วยความยาวคำเฉลี่ย ตัวเลขที่ได้จึงคลาดเคลื่อนได้ราว ±20%
 *
 *   ด้วยเหตุนี้ งบคำจึงเป็น "คำเตือน" เมื่อหลุดกรอบเล็กน้อย
 *   และเป็น "ข้อผิดพลาด" ต่อเมื่อหลุดไปไกลจนเถียงไม่ได้ว่ายาว/สั้นเกิน
 *
 * รัน: npm run check:prose
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, basename } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SRC = join(ROOT, 'src');
const TOKEN_FILE = join(SRC, 'css/custom.css');

const LESSON_FILE = /^(\d{2})-(.+)\.mdx$/;

// กรอบงบคำจาก CONTRIBUTING.md หัวข้อ 3.5
const WORDS_MIN = 1800;
const WORDS_MAX = 3000;
// เกินกรอบนี้ถือว่าผิดแน่ ๆ ไม่ใช่ความคลาดเคลื่อนของการประมาณ
const WORDS_HARD_MIN = 1200;
const WORDS_HARD_MAX = 4200;

// ความยาวคำไทยเฉลี่ยรวมสระและวรรณยุกต์
const THAI_CHARS_PER_WORD = 4.5;

const BANNED = [
  { phrase: 'ง่ายมาก', why: 'ถ้ามันง่ายจริงผู้เรียนคงไม่ต้องมาอ่าน' },
  { phrase: 'แค่นี้เอง', why: 'ทำให้คนที่ยังไม่เข้าใจรู้สึกว่าตัวเองโง่' },
  { phrase: 'ชัดเจนอยู่แล้ว', why: 'สิ่งที่ชัดเจนสำหรับคนเขียน มักไม่ชัดสำหรับคนเรียน' },
  { phrase: 'ง่ายๆ', why: 'ใช้ "ง่าย ๆ" ถ้าจำเป็น และหลีกเลี่ยงการบอกว่าอะไรง่าย' },
];

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}\n    ${msg}`);
const warn = (file, msg) => warnings.push(`${file}\n    ${msg}`);

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

/** ตัดสิ่งที่ไม่ใช่ร้อยแก้วออก ก่อนนับคำและหาคำต้องห้าม */
function stripNonProse(raw) {
  return raw
    .replace(/^---\n[\s\S]*?\n---/, '')      // frontmatter
    .replace(/```[\s\S]*?```/g, '')          // code block
    .replace(/`[^`\n]*`/g, '')               // inline code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')    // คอมเมนต์ MDX
    .replace(/^import .*$/gm, '')            // บรรทัด import
    .replace(/<[^>]+>/g, ' ');               // แท็ก JSX (เก็บข้อความข้างในไว้)
}

/** ประมาณจำนวนคำ: อักขระไทยหารความยาวคำเฉลี่ย + จำนวนคำละติน */
function estimateWords(text) {
  const thaiChars = (text.match(/[฀-๿]/g) ?? []).length;
  const latinWords = (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
  return Math.round(thaiChars / THAI_CHARS_PER_WORD) + latinWords;
}

// ── ตรวจบทเรียน ─────────────────────────────────────────────

function checkLessons() {
  const lessons = walk(DOCS, ['.mdx', '.md']).filter((f) => LESSON_FILE.test(basename(f)));

  for (const full of lessons) {
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const raw = readFileSync(full, 'utf8');
    const prose = stripNonProse(raw);

    // 1. คำต้องห้าม
    for (const { phrase, why } of BANNED) {
      if (prose.includes(phrase)) {
        err(rel, `พบคำต้องห้าม "${phrase}" — ${why}`);
      }
    }

    // 2. ต้องมี misconception callout
    if (!/<Callout\s[^>]*type\s*=\s*["']misconception["']/.test(raw)) {
      err(rel,
        'ไม่มี <Callout type="misconception"> — ทุกบทต้องดักความเข้าใจผิดอย่างน้อย 1 จุด\n' +
        '    วิธีหา: "ถ้าผู้เรียนอ่านบทนี้แบบผิวเผิน เขาจะสรุปผิดว่าอะไร"');
    }

    // 3. งบคำ (ประมาณการ)
    const words = estimateWords(prose);
    if (words < WORDS_HARD_MIN) {
      err(rel, `ประมาณ ${words} คำ — สั้นกว่ากรอบ ${WORDS_MIN}-${WORDS_MAX} มาก เนื้อหาน่าจะยังไม่ครบ`);
    } else if (words > WORDS_HARD_MAX) {
      err(rel, `ประมาณ ${words} คำ — ยาวกว่ากรอบ ${WORDS_MIN}-${WORDS_MAX} มาก ควรแยกเป็น 2 บท`);
    } else if (words < WORDS_MIN || words > WORDS_MAX) {
      warn(rel, `ประมาณ ${words} คำ — นอกกรอบ ${WORDS_MIN}-${WORDS_MAX} เล็กน้อย (ตัวเลขนี้คลาดเคลื่อนได้ ±20%)`);
    }
  }

  return lessons.length;
}

// ── ตรวจการ hardcode สี ─────────────────────────────────────

function checkHardcodedColors() {
  const files = walk(SRC, ['.css', '.tsx', '.ts', '.jsx', '.js']);
  let checked = 0;

  for (const full of files) {
    if (full === TOKEN_FILE) continue; // custom.css คือที่เดียวที่นิยามสีได้
    checked++;
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const lines = readFileSync(full, 'utf8').split('\n');

    lines.forEach((line, i) => {
      // ข้ามบรรทัดคอมเมนต์
      const t = line.trim();
      if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;

      const hex = line.match(/#[0-9a-fA-F]{3,8}\b/g);
      const fn = line.match(/\b(rgba?|hsla?)\s*\(/g);
      if (hex) {
        err(`${rel}:${i + 1}`,
          `hardcode สี ${hex.join(', ')} — ใช้ตัวแปรจาก custom.css เท่านั้น\n    ${t}`);
      } else if (fn) {
        err(`${rel}:${i + 1}`,
          `hardcode สีด้วย ${fn[0]} — ใช้ตัวแปรจาก custom.css เท่านั้น\n    ${t}`);
      }
    });
  }
  return checked;
}

// ── @font-face ต้องไม่อยู่ใต้ src/ ───────────────────────────
//
// ถ้า @font-face อยู่ใน src/ webpack จะสร้างสำเนาไฟล์ฟอนต์ที่มี hash ขึ้นมาอีกชุด
// ทำให้เว็บส่งฟอนต์ซ้ำสองชุด และ <link rel="preload"> ชี้คนละไฟล์กับที่ CSS เรียก
// (เคยเกิดขึ้นจริงและถูกจับได้ตอนตรวจเว็บที่ deploy แล้ว — ดู CLAUDE.md หัวข้อ 3.2)

function checkFontFaceLocation() {
  const files = walk(SRC, ['.css']);
  for (const full of files) {
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const content = readFileSync(full, 'utf8');
    // ข้ามที่อยู่ในคอมเมนต์
    const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/@font-face/.test(stripped)) {
      err(rel,
        '@font-face ห้ามอยู่ใต้ src/ — ต้องอยู่ที่ static/fonts/fonts.css\n' +
        '    webpack จะ hash ชื่อไฟล์ฟอนต์ ทำให้ส่งซ้ำสองชุดและ preload ชี้ผิดไฟล์\n' +
        '    (ดู CLAUDE.md หัวข้อ 3.2)');
    }
  }
  return files.length;
}

// ── รัน ──────────────────────────────────────────────────────

const lessonCount = checkLessons();
const fileCount = checkHardcodedColors();
const cssCount = checkFontFaceLocation();
console.log(`ตรวจตำแหน่ง @font-face: ${cssCount} ไฟล์ CSS`);

console.log(`ตรวจร้อยแก้ว: ${lessonCount} บท`);
console.log(`ตรวจการ hardcode สี: ${fileCount} ไฟล์ใน src/`);

if (warnings.length) {
  console.warn(`\n⚠️  คำเตือน ${warnings.length} ข้อ:\n`);
  for (const w of warnings) console.warn(`  ${w}\n`);
}

if (errors.length) {
  console.error(`\n❌ พบข้อผิดพลาด ${errors.length} จุด:\n`);
  for (const e of errors) console.error(`  ${e}\n`);
  process.exit(1);
}

console.log('✅ ผ่านทุกข้อ');
