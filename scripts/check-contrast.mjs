#!/usr/bin/env node
/**
 * ตรวจคอนทราสต์ของ design token ทุกคู่ ตาม WCAG 2.1
 *
 * ทำไมต้องมี: CLAUDE.md หัวข้อ 8 บังคับ contrast ≥ 4.5:1 ทุกคู่สี
 * แต่กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดภายในไม่กี่เดือน
 * (ตอนออกแบบครั้งแรก มี token 2 ตัวที่ตกเกณฑ์โดยไม่มีใครรู้)
 *
 * รัน: npm run check:contrast
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// รับ path มาทาง argv ได้ เพื่อให้ทดสอบตัวสคริปต์เองได้
const CSS_PATH = process.argv[2] ?? join(ROOT, 'src/css/custom.css');

// ── การคำนวณตามสูตร WCAG 2.1 ────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── อ่าน token จาก custom.css ────────────────────────────────

/** ดึงค่าตัวแปรจากบล็อกที่ selector ตรงกับ pattern */
function readTokens(css, selectorPattern) {
  const start = css.search(selectorPattern);
  if (start === -1) return {};
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = css.slice(open + 1, end);
  const tokens = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

// ── รายการคู่สีที่ต้องตรวจ ──────────────────────────────────
//
// ระดับเกณฑ์:
//   4.5 = ข้อความปกติ (WCAG AA)
//   3.0 = องค์ประกอบที่ไม่ใช่ข้อความ เช่น เส้นขอบ ไอคอน focus ring (WCAG AA non-text)

const CALLOUT_TYPES = ['misconception', 'note', 'tip', 'warning', 'history', 'deepdive'];
const TRACKS = ['prog', 'math', 'hard', 'data', 'net', 'prof'];

function buildChecks() {
  const checks = [];

  // ข้อความหลักบนพื้นทุกแบบ
  for (const bg of ['--rk-bg', '--rk-bg-subtle', '--rk-bg-code']) {
    checks.push({ fg: '--rk-text', bg, min: 4.5, what: 'ข้อความหลัก' });
    checks.push({ fg: '--rk-text-muted', bg, min: 4.5, what: 'ข้อความรอง' });
  }

  // สีประจำแกนวิชา — ใช้เป็นข้อความบน badge จึงต้อง 4.5
  for (const t of TRACKS) {
    checks.push({ fg: `--rk-track-${t}`, bg: '--rk-bg', min: 4.5, what: `สี track ${t}` });
  }

  // accent-text ต้องใช้กับข้อความได้ (--rk-accent เองไม่ตรวจ เพราะห้ามใช้กับข้อความ)
  checks.push({ fg: '--rk-accent-text', bg: '--rk-bg', min: 4.5, what: 'accent สำหรับข้อความ' });

  // ข้อความบนปุ่มหลัก
  checks.push({ fg: '--rk-on-primary', bg: '--rk-primary', min: 4.5, what: 'ข้อความบนปุ่มหลัก' });

  // focus ring — องค์ประกอบที่ไม่ใช่ข้อความ
  checks.push({ fg: '--rk-focus', bg: '--rk-bg', min: 3.0, what: 'focus ring' });
  checks.push({ fg: '--rk-focus', bg: '--rk-bg-subtle', min: 3.0, what: 'focus ring บนพื้นรอง' });

  // callout ทั้ง 6 type
  for (const t of CALLOUT_TYPES) {
    const bg = `--rk-cal-${t}-bg`;
    checks.push({ fg: '--rk-text', bg, min: 4.5, what: `ข้อความใน callout ${t}` });
    checks.push({ fg: `--rk-cal-${t}-icon`, bg, min: 4.5, what: `ไอคอน/หัวเรื่อง callout ${t}` });
    checks.push({ fg: `--rk-cal-${t}-border`, bg, min: 3.0, what: `เส้นขอบ callout ${t}` });
  }

  return checks;
}

// ── รัน ──────────────────────────────────────────────────────

function run() {
  let css;
  try {
    css = readFileSync(CSS_PATH, 'utf8');
  } catch {
    console.error(`❌ อ่านไฟล์ไม่ได้: ${CSS_PATH}`);
    process.exit(1);
  }

  const light = readTokens(css, /:root\s*\{/);
  const darkOverrides = readTokens(css, /\[data-theme=['"]dark['"]\]\s*\{/);
  // โหมดมืดสืบทอดค่าจากโหมดสว่างสำหรับ token ที่ไม่ได้ override
  const dark = { ...light, ...darkOverrides };

  const checks = buildChecks();
  const failures = [];
  const missing = [];
  let passed = 0;

  for (const [themeName, tokens] of [
    ['สว่าง', light],
    ['มืด', dark],
  ]) {
    for (const c of checks) {
      const fg = tokens[c.fg];
      const bg = tokens[c.bg];
      if (!fg || !bg) {
        missing.push(`[${themeName}] ไม่พบ token: ${!fg ? c.fg : c.bg}`);
        continue;
      }
      const ratio = contrast(fg, bg);
      if (ratio === null) {
        missing.push(`[${themeName}] ค่าสีไม่ใช่ hex 6 หลัก: ${c.fg}=${fg} หรือ ${c.bg}=${bg}`);
        continue;
      }
      if (ratio < c.min) {
        failures.push(
          `[${themeName}] ${c.what}\n` +
            `    ${c.fg} (${fg}) บน ${c.bg} (${bg})\n` +
            `    ได้ ${ratio.toFixed(2)}:1 — ต้องการอย่างน้อย ${c.min}:1`,
        );
      } else {
        passed++;
      }
    }
  }

  console.log(`ตรวจคอนทราสต์: ผ่าน ${passed} คู่`);

  if (missing.length) {
    console.error('\n⚠️  token ที่หาไม่เจอหรือรูปแบบไม่ถูก:');
    for (const m of missing) console.error(`  ${m}`);
  }

  if (failures.length) {
    console.error(`\n❌ ไม่ผ่านเกณฑ์ ${failures.length} คู่:\n`);
    for (const f of failures) console.error(`  ${f}\n`);
    console.error('แก้สีใน src/css/custom.css แล้วรันใหม่');
    process.exit(1);
  }

  if (missing.length) {
    process.exit(1);
  }

  console.log('✅ คอนทราสต์ผ่านทั้งหมด ทั้งโหมดสว่างและโหมดมืด');
}

run();
