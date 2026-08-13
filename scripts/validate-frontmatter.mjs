#!/usr/bin/env node
/**
 * ตรวจ frontmatter ของบทเรียนทุกไฟล์ ตาม schema ใน CLAUDE.md หัวข้อ 7
 *
 * ตรวจอะไรบ้าง:
 *   1. ฟิลด์บังคับครบและชนิดถูก
 *   2. id ตรงกับชื่อไฟล์ที่ตัดเลขนำหน้าออกแล้ว
 *   3. ค่าที่มีชุดจำกัด (track, status) อยู่ในชุด
 *   4. ช่วงตัวเลข: stage 0-4, difficulty 1-5, duration 60-120
 *   5. prerequisites ทุกตัวชี้ไป id ที่มีอยู่จริง
 *   6. ไม่มีวงจรวนใน dependency graph   ← ที่ 130 บทจะเกิดโดยไม่ตั้งใจแน่นอน
 *   7. บทที่ published ต้องมีไฟล์เฉลยคู่กัน
 *   8. slug ไม่ซ้ำ
 *   9. status: draft ต้องมี draft: true คู่กัน (ไม่งั้นบทร่างจะหลุดขึ้น production)
 *
 * "บทเรียน" = ไฟล์ .mdx ใน docs/ ที่ชื่อขึ้นต้นด้วยเลขสองหลัก เช่น 02-world-of-zero-and-one.mdx
 * ไฟล์อื่น (intro, roadmap, index, glossary, เฉลย) ไม่ถูกตรวจ
 *
 * รัน: npm run check:frontmatter
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, basename } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SOLUTIONS = join(DOCS, 'appendix/solutions');

const TRACKS = ['PROG', 'MATH', 'HARD', 'DATA', 'NET', 'PROF'];
const STATUSES = ['draft', 'review', 'published'];
const LESSON_FILE = /^(\d{2})-(.+)\.mdx$/;

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}\n    ${msg}`);

// ── เดินหาไฟล์ ──────────────────────────────────────────────

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.mdx') || entry.endsWith('.md')) out.push(full);
  }
  return out;
}

// ── ตัวอ่าน frontmatter แบบง่าย ─────────────────────────────
// รองรับเฉพาะรูปแบบแบนที่ schema ของเราใช้ (key: value และ array แบบ [a, b])
// จงใจไม่พึ่ง dependency ภายนอก — โปรเจกต์นี้ต้องบิลด์ได้อีก 5 ปี

function parseFrontmatter(raw, file) {
  if (!raw.startsWith('---')) {
    err(file, 'ไม่มี frontmatter (ไฟล์ต้องขึ้นต้นด้วย ---)');
    return null;
  }
  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    err(file, 'frontmatter ไม่ถูกปิดด้วย ---');
    return null;
  }
  const body = raw.slice(3, end);
  const data = {};

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;

    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();

    // ตัดคอมเมนต์ท้ายบรรทัด แต่ต้องไม่ตัดในสตริงที่มี #
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const hash = value.indexOf('#');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    if (value === '') {
      data[key] = '';
    } else if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === ''
        ? []
        : inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
    } else if (/^['"].*['"]$/.test(value)) {
      data[key] = value.slice(1, -1);
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      data[key] = Number(value);
    } else {
      data[key] = value;
    }
  }
  return data;
}

// ── ตรวจทีละไฟล์ ────────────────────────────────────────────

function validateOne(fullPath, fm, rel) {
  const name = basename(fullPath);
  const match = name.match(LESSON_FILE);
  const expectedId = match[2];

  const requireField = (key, check, message) => {
    if (fm[key] === undefined || fm[key] === '') {
      err(rel, `ขาดฟิลด์บังคับ: ${key}`);
      return false;
    }
    if (check && !check(fm[key])) {
      err(rel, `${key}: ${message} (ได้ค่า ${JSON.stringify(fm[key])})`);
      return false;
    }
    return true;
  };

  requireField('title', (v) => typeof v === 'string' && v.length > 0, 'ต้องเป็นข้อความ');
  requireField('description', (v) => typeof v === 'string' && v.length >= 20,
    'ต้องเป็นข้อความยาวอย่างน้อย 20 ตัวอักษร (ใช้ทำ meta description)');
  requireField('track', (v) => TRACKS.includes(v), `ต้องเป็นหนึ่งใน ${TRACKS.join('|')}`);
  requireField('status', (v) => STATUSES.includes(v), `ต้องเป็นหนึ่งใน ${STATUSES.join('|')}`);
  requireField('stage', (v) => Number.isInteger(v) && v >= 0 && v <= 4, 'ต้องเป็นจำนวนเต็ม 0-4');
  requireField('difficulty', (v) => Number.isInteger(v) && v >= 1 && v <= 5, 'ต้องเป็นจำนวนเต็ม 1-5');
  requireField('duration', (v) => Number.isInteger(v) && v >= 60 && v <= 120,
    'ต้องอยู่ในช่วง 60-120 นาที (ถ้าเกิน ให้แยกเป็น 2 บท)');
  requireField('last_reviewed', (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v)),
    'ต้องเป็นวันที่รูปแบบ YYYY-MM-DD');

  if (requireField('id', (v) => typeof v === 'string', 'ต้องเป็นข้อความ')) {
    if (fm.id !== expectedId) {
      err(rel, `id ต้องตรงกับชื่อไฟล์ที่ตัดเลขนำหน้าออก\n    คาดว่า "${expectedId}" แต่ได้ "${fm.id}"`);
    }
    if (/^\d/.test(fm.id)) {
      err(rel, `id ห้ามขึ้นต้นด้วยตัวเลข — เลขลำดับอยู่ในชื่อไฟล์เท่านั้น (ดู CLAUDE.md หัวข้อ 7)`);
    }
  }

  requireField('slug', (v) => typeof v === 'string' && !/^\d/.test(v),
    'ต้องเป็นข้อความและห้ามขึ้นต้นด้วยตัวเลข');

  if (fm.prerequisites === undefined) {
    err(rel, 'ขาดฟิลด์บังคับ: prerequisites (ถ้าไม่มีบทก่อนหน้าให้ใส่ [])');
  } else if (!Array.isArray(fm.prerequisites)) {
    err(rel, 'prerequisites ต้องเป็น array เช่น [] หรือ [how-computers-think]');
  }

  if ('sidebar_position' in fm) {
    err(rel, 'ห้ามใส่ sidebar_position ในบทเรียน — ลำดับมาจากเลขนำหน้าชื่อไฟล์เท่านั้น');
  }

  // status: draft ต้องมี draft: true คู่กัน ไม่งั้นบทร่างจะหลุดขึ้น production
  if (fm.status === 'draft' && fm.draft !== true) {
    err(rel, 'status: draft ต้องมี "draft: true" ด้วย ไม่งั้น Docusaurus จะสร้างหน้านี้ขึ้น production');
  }
  if (fm.status !== 'draft' && fm.draft === true) {
    err(rel, `มี "draft: true" แต่ status เป็น "${fm.status}" — สองค่านี้ต้องตรงกัน`);
  }
}

// ── รัน ──────────────────────────────────────────────────────

function run() {
  const all = walk(DOCS);
  const lessons = all.filter((f) => LESSON_FILE.test(basename(f)));

  if (lessons.length === 0) {
    console.log('ตรวจ frontmatter: ยังไม่มีไฟล์บทเรียน (ไฟล์ที่ชื่อขึ้นต้นด้วยเลขสองหลัก)');
    console.log('✅ ผ่าน — ไม่มีอะไรให้ตรวจ');
    return;
  }

  const parsed = [];
  for (const full of lessons) {
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const fm = parseFrontmatter(readFileSync(full, 'utf8'), rel);
    if (!fm) continue;
    validateOne(full, fm, rel);
    parsed.push({ full, rel, fm });
  }

  // ── slug ซ้ำ ──
  const bySlug = new Map();
  for (const p of parsed) {
    if (!p.fm.slug) continue;
    if (bySlug.has(p.fm.slug)) {
      err(p.rel, `slug "${p.fm.slug}" ซ้ำกับ ${bySlug.get(p.fm.slug)}`);
    } else {
      bySlug.set(p.fm.slug, p.rel);
    }
  }

  // ── prerequisites ชี้ไป id ที่มีจริง ──
  const byId = new Map(parsed.filter((p) => p.fm.id).map((p) => [p.fm.id, p]));
  for (const p of parsed) {
    if (!Array.isArray(p.fm.prerequisites)) continue;
    for (const dep of p.fm.prerequisites) {
      if (!byId.has(dep)) {
        err(p.rel, `prerequisites อ้างถึง "${dep}" ซึ่งไม่มีบทไหนใช้ id นี้`);
      }
    }
  }

  // ── ตรวจวงจรวน (DFS หา back edge) ──
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map([...byId.keys()].map((k) => [k, WHITE]));
  const stack = [];

  function visit(id) {
    color.set(id, GRAY);
    stack.push(id);
    const node = byId.get(id);
    for (const dep of node?.fm.prerequisites ?? []) {
      if (!byId.has(dep)) continue;
      if (color.get(dep) === GRAY) {
        const cycle = [...stack.slice(stack.indexOf(dep)), dep].join(' → ');
        err(node.rel, `พบวงจรวนใน prerequisites: ${cycle}`);
      } else if (color.get(dep) === WHITE) {
        visit(dep);
      }
    }
    stack.pop();
    color.set(id, BLACK);
  }
  for (const id of byId.keys()) {
    if (color.get(id) === WHITE) visit(id);
  }

  // ── บทที่ published ต้องมีเฉลย ──
  for (const p of parsed) {
    if (p.fm.status !== 'published' || !p.fm.slug) continue;
    const hasSolution =
      existsSync(join(SOLUTIONS, `${p.fm.slug}.mdx`)) ||
      existsSync(join(SOLUTIONS, `${p.fm.slug}.md`));
    if (!hasSolution) {
      err(p.rel,
        `status: published แต่ไม่มีไฟล์เฉลย docs/appendix/solutions/${p.fm.slug}.mdx\n` +
        '    (เฉลยต้องเขียนพร้อมบท ไม่ใช่ตามมาทีหลัง — ดู CONTRIBUTING.md หัวข้อ 6)');
    }
  }

  // ── รายงาน ──
  console.log(`ตรวจ frontmatter: ${parsed.length} บท`);
  if (warnings.length) {
    console.warn(`\n⚠️  คำเตือน ${warnings.length} ข้อ:`);
    for (const w of warnings) console.warn(`  ${w}`);
  }
  if (errors.length) {
    console.error(`\n❌ พบข้อผิดพลาด ${errors.length} จุด:\n`);
    for (const e of errors) console.error(`  ${e}\n`);
    process.exit(1);
  }
  console.log('✅ frontmatter ถูกต้องทุกไฟล์');
}

run();
