# CLAUDE.md — คู่มือโปรเจกต์สำหรับ Claude Code

> ไฟล์นี้คือแหล่งอ้างอิงหลักของโปรเจกต์
> **อ่านไฟล์นี้ทุกครั้งก่อนเริ่มงานใหม่**
> ก่อนเขียนบทเรียน อ่าน `CONTRIBUTING.md` — ก่อนตัดสินใจว่าจะเขียนบทอะไร อ่าน `CURRICULUM.md`

---

## 0. บริบทโปรเจกต์

**ชื่อโปรเจกต์:** RAKTHAN (รากฐาน)
**Tagline:** รากฐานวิศวกรรมคอมพิวเตอร์ ตั้งแต่บิตแรกถึงปีสุดท้าย
**Tagline (EN):** Computer Engineering from the ground up

### การเขียนชื่อ — ล็อกตายตัว ห้ามใช้รูปแบบอื่น

| บริบท | รูปแบบ |
|---|---|
| โลโก้ / หัวเว็บ / หน้าปกสไลด์ | `RAKTHAN` |
| ในประโยค / เนื้อหา | `Rakthan` |
| repo, โดเมน, package name, path | `rakthan` |
| CSS variable prefix | `--rk-` |
| localStorage key prefix | `rk-` |

**ห้ามสะกด** `Rakthaan`, `RakThan`, `Rak Than`, `รากฐาน` (ในโค้ด/ชื่อไฟล์) เด็ดขาด

**คืออะไร:** เว็บคอร์สสอนเทคโนโลยีภาษาไทย ตั้งแต่ระดับผู้ไม่เคยเขียนโค้ด จนถึงระดับปริญญาตรีวิศวกรรมคอมพิวเตอร์ปี 4
**ขนาด:** ประมาณ 130 บทเรียน แบ่งเป็น 5 stage และ 6 แกนวิชา — รายชื่อบทจริงอยู่ใน `CURRICULUM.md`
**ผู้เรียนเป้าหมาย:** นักเรียนมัธยมปลายไทย และนักศึกษาปริญญาตรี
**ภาษา:** ไทยเป็นหลัก ศัพท์เทคนิคคงภาษาอังกฤษ

**สัญญาอนุญาต:**
- เนื้อหาใน `docs/` และ `slides/` — **CC BY-SA 4.0**
- โค้ดใน `src/`, `code/`, `scripts/` — **MIT**

**ข้อจำกัดที่สำคัญที่สุด:**
- ต้องเป็น **static site** ล้วน ไม่มี backend ไม่มีฐานข้อมูล (เพราะต้องโฮสต์ฟรีถาวร)
- โค้ดที่ผู้เรียนรันต้องรันใน**เบราว์เซอร์ของผู้เรียน**เท่านั้น
- ต้องรองรับภาษาไทยได้สมบูรณ์ทั้งบนเว็บและตอน export
- **ห้ามพึ่งพา cross-origin isolation (COOP/COEP)** — ดูเหตุผลที่หัวข้อ 4/C2

---

## 1. Tech Stack (ตัดสินใจแล้ว ห้ามเปลี่ยนโดยไม่ถาม)

| ส่วน | เลือกใช้ | เหตุผล |
|---|---|---|
| Site generator | **Docusaurus v3** (TypeScript) | จัดการ sidebar/routing/versioning ของเนื้อหา 130 บทให้เอง |
| ภาษาเนื้อหา | **MDX** (`.mdx`) | เขียน Markdown ได้ ฝัง React component ได้ |
| Styling | **CSS Modules + CSS Variables** | ไม่ใช้ Tailwind — เพราะต้อง override Docusaurus theme เยอะ |
| ฟอนต์ | **IBM Plex Sans Thai + IBM Plex Mono — self-host** | ดูหัวข้อ 3.2 ห้ามใช้ Google Fonts CDN |
| Python runner | **Pyodide** (โหลดจาก CDN, lazy load) | รัน Python จริงในเบราว์เซอร์ |
| SQL runner | **sql.js** | SQLite บน WASM สำหรับบทฐานข้อมูล |
| ไดอะแกรม | **Mermaid ผ่าน `<Diagram>`** + **SVG เขียนเอง** | Mermaid สำหรับ flowchart, SVG สำหรับวงจร/สถาปัตยกรรม — **ห้ามใช้ `@docusaurus/theme-mermaid`** ดูหัวข้อ 9 |
| สูตรคณิต | **KaTeX** (remark-math + rehype-katex) | เร็วกว่า MathJax |
| Search | ⚠️ **ยังไม่ตัดสินใจ — ต้องทำ spike ก่อน** | ดูหัวข้อ 1.1 |
| สไลด์ | ⏸️ **Marp — เลื่อนออกไปหลัง Phase 3** | ดูหัวข้อ 1.2 |
| Hosting | **Cloudflare Pages** | Bandwidth ไม่จำกัด, edge server ในไทย |
| CI | **GitHub Actions** | build + validate + contrast + prose lint |

**ห้ามเพิ่ม dependency ใหม่โดยไม่ถามก่อน** โปรเจกต์นี้ต้องบิลด์ได้ 5 ปีข้างหน้า dependency ยิ่งน้อยยิ่งดี

### 1.1 Search — ปัญหาที่ยังไม่แก้ ⚠️

**Docusaurus ไม่มี search ในตัว** ต้องเลือกเพิ่มเอง และปัญหาที่แท้จริงคือ **ภาษาไทยไม่มีช่องว่างระหว่างคำ** — search engine ที่ตัดคำด้วยช่องว่างจะค้นภาษาไทยแทบไม่ได้เลย ต้องใช้ตัวตัดคำแบบพจนานุกรม

**ห้ามเลือกโดยไม่ทดสอบ** ก่อนตัดสินใจต้องทำ spike: เอาเนื้อหาไทยจริง 3 บทไปลองทั้ง Algolia DocSearch และ local search plugin แล้ววัดว่าค้นคำไทยกลางประโยคเจอไหม

ตราบใดที่ยังไม่ได้ทำ spike ให้ปล่อยไซต์ไม่มี search ไปก่อน — ดีกว่าใส่ search ที่ค้นไม่เจอ

### 1.2 Marp — ทำไมถึงเลื่อน

Marp รับ **Markdown ธรรมดา** เท่านั้น ไฟล์ `.mdx` ที่มี `import` และ `<Callout>` / `<PythonRunner>` จะพังหรือแสดงเป็นข้อความดิบ **แผนเดิม "แปลง md ชุดเดียวกันเป็นสไลด์" เป็นไปไม่ได้**

เมื่อถึงเวลาทำจริง ให้เลือกทางใดทางหนึ่ง แล้วบันทึกไว้ที่นี่:
1. เขียนสไลด์แยกเป็น `.md` ธรรมดา (สไลด์กับบทเรียนควรต่างกันอยู่แล้ว — สไลด์เป็นตัวช่วยครู ไม่ใช่บทเรียนย่อ)
2. เขียน transform script ตัด JSX ออกจาก MDX

**ตอนนี้: ไม่ต้องทำอะไรกับ `slides/` จนกว่าจะจบ Phase 3**

---

## 2. โครงสร้างโฟลเดอร์

```
rakthan/
├── CLAUDE.md                    # ไฟล์นี้ — การตัดสินใจทางเทคนิค
├── CONTRIBUTING.md              # กติกาการเขียนเนื้อหา
├── CURRICULUM.md                # รายชื่อบทและลำดับ dependency
├── LICENSE                      # อธิบายว่าส่วนไหนใช้สัญญาอนุญาตอะไร
├── LICENSE-CONTENT              # CC BY-SA 4.0 (docs/, slides/)
├── LICENSE-CODE                 # MIT (src/, code/, scripts/)
├── docusaurus.config.ts
├── sidebars.ts
│
├── docs/
│   ├── intro.mdx
│   ├── roadmap.mdx
│   ├── stage-0-foundations/
│   ├── stage-1-year1/
│   │   ├── 1a-mathematics/
│   │   ├── 1b-programming-c/
│   │   ├── 1c-digital-hardware/
│   │   └── 1d-professional/
│   ├── stage-2-year2/
│   ├── stage-3-year3/
│   ├── stage-4-year4/
│   └── appendix/
│       ├── glossary.mdx         # ศัพท์เทคนิคกลาง — ทุกบทลิงก์มาที่นี่
│       └── solutions/           # เฉลยแบบฝึกหัด 1 ไฟล์ต่อ 1 บท
│
├── src/
│   ├── css/
│   │   ├── custom.css           # tokens + base
│   │   └── thai-typography.css
│   ├── components/
│   │   ├── PythonRunner/
│   │   ├── SqlRunner/
│   │   ├── Quiz/
│   │   ├── Callout/
│   │   ├── LogicGate/
│   │   ├── BinaryConverter/
│   │   ├── TrackBadge/
│   │   └── ProgressTracker/
│   └── theme/                   # swizzled components
│
├── code/                        # โค้ดตัวอย่างที่ทดสอบได้จริง
├── slides/                      # Marp — ว่างไว้จนจบ Phase 3
├── static/
│   ├── fonts/                   # woff2 ที่ self-host — อยู่ใน git
│   └── img/diagrams/
└── scripts/
    ├── new-lesson.mjs
    ├── validate-frontmatter.mjs
    ├── check-contrast.mjs
    └── check-prose.mjs
```

---

## 3. Design System

### 3.1 Design Tokens

ใส่ใน `src/css/custom.css` — **ห้าม hardcode สีที่อื่นเด็ดขาด**

> **ทุกค่าสีในไฟล์นี้ผ่าน `scripts/check-contrast.mjs` แล้ว**
> ถ้าจะแก้สี ต้องรันสคริปต์ซ้ำและผ่านก่อน commit — CI จะ fail ถ้าไม่ผ่าน

```css
:root {
  /* ── Brand ── */
  --rk-primary: #1e5f8e;          /* 6.81:1 บนขาว */
  --rk-primary-dark: #164a70;
  --rk-primary-light: #2d7fb8;

  /* --rk-accent ใช้ได้เฉพาะพื้นหลัง เส้นขอบ และไอคอนขนาดใหญ่
     ห้ามใช้กับข้อความ — คอนทราสต์แค่ 2.99:1 */
  --rk-accent: #e07a3f;
  --rk-accent-text: #a75b2f;      /* 5.02:1 — ใช้กับข้อความแทน */

  /* ── สีประจำแกนวิชา (Track colors) — ผ่าน 5:1 ทุกตัวบนพื้นขาว ── */
  --rk-track-prog: #487957;   /* เขียว        - Programming   5.06:1 */
  --rk-track-math: #6b5b95;   /* ม่วง         - Mathematics   5.91:1 */
  --rk-track-hard: #a65c1b;   /* ส้มเข้ม      - Hardware      5.04:1 */
  --rk-track-data: #2c7873;   /* เขียวน้ำทะเล - Data/AI       5.20:1 */
  --rk-track-net:  #1e5f8e;   /* น้ำเงิน      - Networks      6.81:1 */
  --rk-track-prof: #856b44;   /* น้ำตาล       - Professional  5.02:1 */

  /* ── Callout — ครบทั้ง 6 type ที่ <Callout> รองรับ ──
     -bg     พื้นกล่อง
     -border เส้นขอบ (≥3:1 เทียบพื้นกล่อง)
     -icon   ไอคอนและหัวเรื่อง (≥4.5:1 เทียบพื้นกล่อง) */
  --rk-cal-misconception-bg: #fff8e6;
  --rk-cal-misconception-border: #c48200;
  --rk-cal-misconception-icon: #9c6800;

  --rk-cal-note-bg: #eef4fa;
  --rk-cal-note-border: #1e5f8e;
  --rk-cal-note-icon: #1e5f8e;

  --rk-cal-tip-bg: #edf7ed;
  --rk-cal-tip-border: #4a7c59;
  --rk-cal-tip-icon: #497a58;

  --rk-cal-warning-bg: #fdefef;
  --rk-cal-warning-border: #c74343;
  --rk-cal-warning-icon: #c24141;

  --rk-cal-history-bg: #f7f3ec;
  --rk-cal-history-border: #8b6f47;
  --rk-cal-history-icon: #866b45;

  --rk-cal-deepdive-bg: #f3f1f8;
  --rk-cal-deepdive-border: #6b5b95;
  --rk-cal-deepdive-icon: #6b5b95;

  /* ── Surface ── */
  --rk-bg: #ffffff;
  --rk-bg-subtle: #f7f8fa;
  --rk-bg-code: #f4f5f7;
  --rk-border: #e2e5e9;
  --rk-text: #1a1d21;
  --rk-text-muted: #5a6169;       /* 6.27:1 บนขาว */

  /* ── Focus ring — จำเป็นตามหัวข้อ 8 ── */
  --rk-focus: #1e5f8e;            /* 6.81:1 บนขาว */
  --rk-focus-width: 3px;
  --rk-focus-offset: 2px;

  /* ── Spacing ── */
  --rk-space-1: 0.25rem;   /*  4px */
  --rk-space-2: 0.5rem;    /*  8px */
  --rk-space-3: 1rem;      /* 16px */
  --rk-space-4: 1.5rem;    /* 24px */
  --rk-space-5: 2rem;      /* 32px */
  --rk-space-6: 3rem;      /* 48px */

  /* ── Type scale ── */
  --rk-text-sm: 0.9375rem;   /* 15px — ห้ามใช้กับเนื้อหาไทย ใช้กับ metadata เท่านั้น */
  --rk-text-base: 1rem;      /* 17px ตาม --ifm-font-size-base */
  --rk-text-lg: 1.125rem;
  --rk-text-xl: 1.375rem;

  --rk-radius: 8px;
  --rk-radius-lg: 12px;
  --rk-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);

  /* ── Motion — ทุกอันต้องถูกปิดโดย prefers-reduced-motion ── */
  --rk-transition: 150ms ease;
}

[data-theme='dark'] {
  --rk-bg: #16181d;
  --rk-bg-subtle: #1e2127;
  --rk-bg-code: #22262e;
  --rk-border: #2e333c;
  --rk-text: #e8eaed;
  --rk-text-muted: #9aa2ad;       /* 6.89:1 บนพื้นมืด */

  --rk-accent-text: #e89a63;
  --rk-focus: #6ab0e8;            /* 7.60:1 บนพื้นมืด */

  /* สี track โหมดมืด — ผ่าน 5:1 ทุกตัวบนพื้น #16181d */
  --rk-track-prog: #6fa87f;   /* 6.41:1 */
  --rk-track-math: #9182bd;   /* 5.19:1 */
  --rk-track-hard: #d98c45;   /* 6.59:1 */
  --rk-track-data: #4aa39d;   /* 5.93:1 */
  --rk-track-net:  #4a8fc0;   /* 5.06:1 */
  --rk-track-prof: #b09370;   /* 6.13:1 */

  /* Callout โหมดมืด — ต้อง redefine ทั้ง bg, border และ icon
     (ของเดิม redefine แค่ bg ทำให้เส้นขอบผิดเพี้ยน) */
  --rk-cal-misconception-bg: #2a2415;
  --rk-cal-misconception-border: #e0a52e;
  --rk-cal-misconception-icon: #e0a52e;

  --rk-cal-note-bg: #16222d;
  --rk-cal-note-border: #4a8fc0;
  --rk-cal-note-icon: #4a8fc0;

  --rk-cal-tip-bg: #17251b;
  --rk-cal-tip-border: #6fa87f;
  --rk-cal-tip-icon: #6fa87f;

  --rk-cal-warning-bg: #2a1818;
  --rk-cal-warning-border: #d96b6b;
  --rk-cal-warning-icon: #d96b6b;

  --rk-cal-history-bg: #26211a;
  --rk-cal-history-border: #b09370;
  --rk-cal-history-icon: #b09370;

  --rk-cal-deepdive-bg: #201d2a;
  --rk-cal-deepdive-border: #9182bd;
  --rk-cal-deepdive-icon: #9182bd;
}
```

### 3.2 ฟอนต์ — self-host เท่านั้น

**ห้ามใช้ `@import url('https://fonts.googleapis.com/...')`** เหตุผล 4 ข้อ:
1. `@import` ใน CSS เป็น render-blocking และสร้าง request chain (CSS → CSS → ไฟล์ฟอนต์) — ช้าที่สุดเท่าที่จะเป็นไปได้ และขัดกับกฎ preconnect ในหัวข้อ 9
2. ควบคุม `font-display` และ `preload` เองไม่ได้
3. ส่งข้อมูล IP ผู้เรียนไทยไปให้บุคคลที่สาม (ประเด็น PDPA)
4. ผูกการเรนเดอร์หน้าไว้กับ CDN ที่เราคุมไม่ได้ ในโปรเจกต์ที่ต้องอยู่ 5 ปี

**โหลดแค่ 2 น้ำหนัก** — 400 กับ 600 เท่านั้น (ของเดิม 4 น้ำหนักกินพื้นที่เกินงบไปมาก และ 500/700 แทบแยกไม่ออกด้วยตาเปล่า)

ไฟล์ `.woff2` เก็บใน `static/fonts/` และ **commit ลง git** เพื่อให้บิลด์ได้แม้อีก 5 ปีข้างหน้า

#### ❗ `@font-face` ต้องอยู่ใน `static/fonts/fonts.css` ห้ามอยู่ใน `src/css/`

**นี่คือ bug จริงที่เคยเกิดขึ้นแล้วและถูกจับได้ตอนตรวจเว็บที่ deploy จริง**

webpack ประมวลผล `url()` ของ CSS ทุกไฟล์ที่อยู่ใต้ `src/` แล้วสร้าง**สำเนา**ไฟล์ฟอนต์ที่มี hash
ต่อท้ายชื่อไว้ที่ `/assets/fonts/` ส่วนไฟล์ใน `static/` ถูกคัดลอกตรง ๆ ไปที่ `/fonts/`

ผลที่ตามมาเมื่อ `@font-face` อยู่ใน `src/css/custom.css`:

| อาการ | ผลกระทบ |
|---|---|
| ฟอนต์ถูกส่งขึ้นเว็บสองชุด | 146 KB แทนที่จะเป็น 73 KB |
| CSS เรียก `/assets/fonts/...` แต่ preload ชี้ `/fonts/...` | เบราว์เซอร์โหลดทิ้งเปล่า ~29 KB ต่อการเปิดหน้าแรก |
| preload อุ่นผิดไฟล์ | ไม่ได้ประโยชน์อะไรเลย |

**วิธีที่ถูก:** ประกาศ `@font-face` ใน `static/fonts/fonts.css` แล้วโหลดผ่าน `stylesheets`
ใน `docusaurus.config.ts` — path จะคงที่และตรงกับ `<link rel="preload">` เสมอ
(เป็นวิธีเดียวกับที่ใช้กับ KaTeX CSS อยู่แล้ว)

```ts
// docusaurus.config.ts
stylesheets: [
  { href: '/fonts/fonts.css', type: 'text/css' },
  { href: '/katex/katex.min.css', type: 'text/css' },
],
```

**วิธีตรวจว่ายังถูกอยู่:** หลัง `npm run build` โฟลเดอร์ `build/assets/fonts/` **ต้องไม่มี**
ถ้ามีขึ้นมาเมื่อไหร่ แปลว่ามีคนย้าย `@font-face` กลับเข้า `src/` แล้ว

**สำคัญ:** เพราะโหลดแค่ 400/600 ต้องตั้งตัวหนาเป็น 600 ด้วย ไม่งั้นเบราว์เซอร์จะสังเคราะห์ตัวหนา 700 ขึ้นมาเอง (synthetic bold) ซึ่งทำให้สระและวรรณยุกต์ไทยเละ

```css
:root {
  --ifm-font-weight-semibold: 600;
  --ifm-font-weight-bold: 600;   /* ห้ามเป็น 700 */
}
```

### 3.3 Typography ภาษาไทย — สำคัญมาก

**ปัญหาที่ต้องแก้:** ภาษาไทยมีสระบนและวรรณยุกต์ซ้อนกัน 2 ชั้น ถ้าใช้ `line-height` มาตรฐานของเว็บฝรั่ง (1.5) สระจะชนกันระหว่างบรรทัด อ่านแล้วอึดอัด

```css
:root {
  --ifm-font-family-base: 'IBM Plex Sans Thai', -apple-system, 'Segoe UI', sans-serif;
  --ifm-font-family-monospace: 'IBM Plex Mono', 'Consolas', monospace;

  /* ค่าที่ปรับมาสำหรับภาษาไทยโดยเฉพาะ */
  --ifm-line-height-base: 1.85;
  --ifm-font-size-base: 17px;
  --ifm-heading-line-height: 1.5;
  --ifm-paragraph-margin-bottom: 1.25rem;
}

/* ความกว้างบรรทัดที่อ่านสบาย
   ห้ามใช้หน่วย ch — ch คือความกว้างของเลข "0" ในฟอนต์
   อักขระไทยแคบกว่า "0" ทำให้ 68ch บรรจุอักษรไทยได้มากกว่า 68 ตัวมาก
   ผลคือบรรทัดยาวเกินตั้งใจ ซึ่งตรงข้ามกับเหตุผลที่เราจำกัดความกว้างตั้งแต่แรก */
.markdown {
  max-width: 40rem;   /* ~680px — วัดจากเนื้อหาไทยจริง ไม่ใช่ประมาณจาก ch */
}

/* หัวข้อภาษาไทยต้องการ padding บนมากกว่าปกติ เพราะสระบนของบรรทัดแรก */
.markdown h2 {
  margin-top: 3rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--rk-border);
}

.markdown h3 { margin-top: 2rem; }

/* ห้ามตัดคำไทยกลางคำ
   เบราว์เซอร์ตัดบรรทัดภาษาไทยด้วยพจนานุกรมได้ก็ต่อเมื่อมี lang="th"
   ซึ่งมาจาก i18n.defaultLocale ใน docusaurus.config.ts — ห้ามลบ */
.markdown p, .markdown li {
  word-break: normal;
  overflow-wrap: break-word;
  line-break: normal;
  hyphens: none;
}

/* โค้ดในบรรทัดข้อความไทย ต้องลด line-height ไม่งั้นบรรทัดเบี้ยว */
.markdown code {
  line-height: 1.4;
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: var(--rk-bg-code);
  border-radius: 4px;
}

/* ตารางภาษาไทยต้องการ padding มากกว่าปกติ */
.markdown table td,
.markdown table th {
  padding: 0.75rem 1rem;
  line-height: 1.7;
}

/* Focus ring — ต้องเห็นชัดทั้งสองโหมด */
:where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
  outline: var(--rk-focus-width) solid var(--rk-focus);
  outline-offset: var(--rk-focus-offset);
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**กฎเหล็กเรื่องฟอนต์:**
1. `line-height` ของเนื้อหาภาษาไทย **ห้ามต่ำกว่า 1.75**
2. ฟอนต์ขนาดเนื้อหา **ห้ามต่ำกว่า 16px** (ไทยต้องการใหญ่กว่าอังกฤษเพราะรายละเอียดสระ) — `--rk-text-sm` (15px) ใช้ได้เฉพาะข้อมูลกำกับ เช่น TrackBadge ห้ามใช้กับเนื้อหา
3. **ห้ามใช้ `text-transform: uppercase`** กับข้อความที่อาจมีภาษาไทยปน
4. **ห้ามใช้ฟอนต์บาง (weight < 400)** กับภาษาไทย สระจะหายตอนแสดงบนจอความละเอียดต่ำ
5. **ห้ามใช้ตัวหนา 700** เพราะไม่ได้โหลดมา จะได้ synthetic bold ที่ทำให้สระไทยเละ

---

## 4. Component ที่ต้องสร้าง

เรียงตามลำดับความสำคัญ สร้างทีละตัว ทดสอบให้ผ่านก่อนไปตัวถัดไป

### C1. `<Callout>` — กล่องเน้นข้อความ
**Priority: สูงสุด** (ใช้ทุกบท)

```tsx
<Callout type="misconception" title="คนมักเข้าใจผิดว่า">
  เนื้อหา...
</Callout>
```

- `type`: `misconception` | `note` | `tip` | `warning` | `history` | `deepdive`
- `misconception` = สีเหลือง มีไอคอนเครื่องหมายคำถาม (ใช้บ่อยที่สุด)
- `deepdive` = พับเก็บได้ (collapsible) สำหรับเนื้อหาที่ลึกเกินระดับ ใช้ `<details>` ของ HTML เพื่อให้ทำงานได้แม้ JS ไม่โหลด
- `history` = เกร็ดประวัติศาสตร์ สีน้ำตาลอ่อน
- ใช้ token `--rk-cal-{type}-bg` / `-border` / `-icon` — **มีครบทั้ง 6 type แล้วในหัวข้อ 3.1**
- ต้องมี `role="note"` และ heading ที่ screen reader อ่านได้
- แต่ละ type ต้องมีไอคอนต่างกัน — ห้ามแยกด้วยสีอย่างเดียว

---

### C2. `<PythonRunner>` — รัน Python ในเบราว์เซอร์
**Priority: สูงสุด** (หัวใจของ Stage 0)

```tsx
<PythonRunner
  initialCode={`name = input("ชื่อ: ")\nprint(f"สวัสดี {name}")`}
  stdin={'สมชาย'}
  packages={['numpy']}
  editable
  expectedOutput="สวัสดี สมชาย"
/>
```

ข้อกำหนดทางเทคนิค:
- **Lazy load Pyodide** — โหลดเฉพาะเมื่อผู้เรียนกดปุ่ม "รัน" ครั้งแรก (Pyodide หนักมาก ห้ามโหลดตอนเปิดหน้า)
- แสดง progress bar ตอนโหลดครั้งแรก พร้อมข้อความ "กำลังเตรียม Python... (ครั้งแรกใช้เวลาสักครู่)"
- ใช้ **Web Worker** — ห้ามรันบน main thread ไม่งั้น infinite loop จะทำให้หน้าค้างทั้งหน้า
- **แคช Pyodide instance ไว้ระดับ global** — ถ้าหน้าเดียวมี runner 5 ตัว ต้องโหลด Pyodide แค่ครั้งเดียว
- มีปุ่ม **หยุด** และปุ่ม **รีเซ็ต** กลับเป็นโค้ดตั้งต้น
- แสดง stderr เป็นสีแดงแยกจาก stdout
- ถ้าเบราว์เซอร์ไม่รองรับ WASM ให้แสดงโค้ดเป็น code block ธรรมดา + ลิงก์ไป Google Colab

#### นาฬิกาสองตัว — ห้ามใช้ timeout เดียว

| อะไร | เวลา | ทำไม |
|---|---|---|
| รันโค้ดของผู้เรียน | 10 วินาที (ปรับได้ด้วย prop `timeout`) | ดักลูปไม่รู้จบ |
| โหลด Pyodide + package | ไม่จำกัด แต่ต้องมี progress bar | โหลด `numpy` บนมือถือเน็ตช้าเกิน 10 วินาทีได้ง่าย ๆ |

ถ้าใช้นาฬิกาเดียว ผู้เรียนจะเห็น timeout ทั้งที่โค้ดไม่มีปัญหา แล้วโทษตัวเอง

#### `input()` — ตัดสินใจแล้ว: ใช้ stdin buffer ❗

**ห้ามใช้ `SharedArrayBuffer` + `Atomics.wait()`**

เหตุผล: `window.prompt()` เรียกจาก Web Worker ไม่ได้ และการทำให้ `input()` บล็อกรอผู้ใช้จริง ๆ ต้องใช้ `SharedArrayBuffer` ซึ่งต้องเปิด **cross-origin isolation (COOP `same-origin` + COEP `require-corp`) ทั้งเว็บไซต์** ผลข้างเคียงคือ:
- Pyodide ที่โหลดจาก CDN จะพัง ถ้า CDN ไม่ส่ง CORP header
- iframe ข้าม origin ทั้งหมด (YouTube, CodePen, embed อื่น ๆ) จะพัง
- ผูกทั้งไซต์ไว้กับข้อจำกัดนี้ตลอดไป เพื่อฟีเจอร์เดียว

**วิธีที่ใช้แทน:** `<PythonRunner>` มีช่อง "อินพุต" (textarea) แยกจากช่องโค้ด ผู้เรียนกรอกไว้ล่วงหน้า แล้ว patch `input()` ให้อ่านจาก buffer นั้นทีละบรรทัด
- ถ้า buffer หมดแล้วโค้ดยังเรียก `input()` อีก → โยน `EOFError` พร้อมข้อความไทยที่บอกว่าต้องเติมอินพุตเพิ่ม
- prop `stdin` ตั้งค่าเริ่มต้นให้ได้จากบทเรียน
- ต้องแสดงข้อความที่ `input()` อ่านไปใน output ด้วย เพื่อให้เห็นว่าโปรแกรมรับอะไรเข้าไป

เสีย UX ไปเล็กน้อย แลกกับการไม่ผูกสถาปัตยกรรมทั้งไซต์ไว้กับข้อจำกัดที่ถอนไม่ได้

#### Accessibility ของ editor
- ต้องออกจาก Tab trap ได้ (กด Escape แล้ว Tab)
- ต้องมีโหมด **textarea ธรรมดา** สำรอง เพราะ code editor สมัยใหม่แทบทุกตัวใช้กับ screen reader ไม่ได้

---

### C3. `<Quiz>` — แบบทดสอบ
**Priority: สูง**

```tsx
<Quiz
  question="บิต 6 ตัว แทนค่าได้กี่แบบ?"
  options={[
    { text: '12', feedback: 'นี่คือ 6×2 — ลองทบทวนว่าเพิ่มบิตแล้วจำนวนแบบคูณหรือบวก' },
    { text: '64', correct: true, feedback: 'ถูกต้อง — 2⁶ = 64' },
    { text: '36', feedback: 'นี่คือ 6² — สังเกตว่าฐานกับเลขชี้กำลังสลับที่กัน' },
  ]}
/>
```

**หลักการสำคัญ:** ตัวเลือกที่ผิดต้องมี `feedback` ที่**อธิบายว่าผู้เรียนคิดผิดตรงไหน** ไม่ใช่แค่บอก "ผิด" — ตัวลวงแต่ละตัวต้องสะท้อนความเข้าใจผิดที่เกิดขึ้นจริง

- เก็บผลลง `localStorage` (key: `rk-quiz-{lessonId}-{index}`)
- ตอบผิดแล้วลองใหม่ได้ ไม่จำกัดครั้ง
- ห้ามใช้สีเดียวบอกถูก/ผิด ต้องมีไอคอนด้วย (accessibility)
- ใช้ทั้ง**ต้นบท** (ทวนของเก่า) **กลางบท** (เช็คว่าตามทัน) และ**ท้ายบท** — ดู `CONTRIBUTING.md`

---

### C4. `<TrackBadge>` + Frontmatter Header
**Priority: สูง**

แสดงแถบข้อมูลบนสุดของทุกบท: แกนวิชา (สีตาม track), ระดับความยาก (1–5 จุด), เวลาโดยประมาณ, บทที่ต้องเรียนมาก่อน (เป็นลิงก์)

Swizzle `DocItem/Content` เพื่อดึงค่าจาก frontmatter มาแสดงอัตโนมัติ — **ห้ามให้คนเขียนบทต้องพิมพ์เอง**

**เรื่องตาราง `id → url`:** แผนเดิมคิดว่าต้องเขียน Docusaurus plugin ที่ inject `globalData` เอง
แต่ตอนทำจริงพบว่า **ไม่ต้อง** — Docusaurus มีให้อยู่แล้วสองตัวที่ใช้คู่กัน:

| hook | ให้อะไร |
|---|---|
| `useAllDocsData()` | `versions[].docs[]` ที่มี `{ id, path }` |
| `useDocsVersion()` | `docs[id]` ที่มี `{ title }` |

ต้องใช้ทั้งสองตัว เพราะตัวแรกไม่มีชื่อบท ตัวหลังไม่มี url
และต้องแสดง**ชื่อบท** ไม่ใช่ `id` — ผู้เรียนอ่าน `how-computers-think` ไม่รู้เรื่อง

`id` ที่ Docusaurus ใช้จริงมี path นำหน้า (`stage-0-foundations/how-computers-think`)
แต่ frontmatter เขียนสั้น ๆ จึงต้องจับคู่ด้วยส่วนท้ายของ id ด้วย

- ระดับความยากห้ามสื่อด้วยจุดสีอย่างเดียว ต้องมีข้อความ `aria-label` เช่น "ความยาก 3 จาก 5"

---

### C5. `<BinaryConverter>` — เครื่องมือโต้ตอบสำหรับบท 0.2
**Priority: กลาง**

ช่องกรอกเลขฐาน 10 / 2 / 16 สามช่อง แก้ช่องไหนอีกสองช่องอัปเดตทันที + แสดงการกระจายน้ำหนักแต่ละบิตเป็นภาพ (กดสลับ 0/1 ได้)

---

### C6. `<LogicGate>` — วงจรลอจิกกดได้
**Priority: กลาง** (ใช้ใน Stage 1C)

SVG ที่มีสวิตช์อินพุตกดได้ แล้วเห็นสัญญาณไหลผ่านเกตพร้อมไฟเอาต์พุตเปลี่ยน + ตารางความจริงที่ไฮไลต์แถวปัจจุบัน

---

### C7. `<SqlRunner>` — สำหรับ Stage 2
**Priority: ต่ำ** (ทำตอนถึง Stage 2)

sql.js + ฐานข้อมูลตัวอย่างที่โหลดล่วงหน้า แสดงผลเป็นตาราง

---

### C8. `<ProgressTracker>`
**Priority: ต่ำ**

ติ๊กบทที่เรียนจบแล้ว เก็บใน `localStorage` แสดง % ความคืบหน้าแต่ละ stage
**ต้องมีปุ่ม export/import ความคืบหน้าเป็นไฟล์ JSON** เพราะ localStorage หายได้และข้ามเครื่องไม่ได้

---

## 5. ลำดับงาน (ทำตามลำดับนี้)

### Phase 1 — วางฐาน
- [ ] `git init` + `.gitignore`
- [ ] Scaffold Docusaurus classic (TypeScript) **ที่ root ของ repo** (ไม่ใช่โฟลเดอร์ซ้อน)
- [ ] ตั้งค่า `docusaurus.config.ts`: locale `th`, ชื่อไซต์, ปิด blog, เปิด Mermaid + KaTeX, `onBrokenLinks: 'throw'`, ตั้ง `editUrl`
- [ ] ดาวน์โหลดฟอนต์ลง `static/fonts/` + เขียน `@font-face` (ห้าม Google Fonts)
- [ ] สร้าง `custom.css` + `thai-typography.css` ตามหัวข้อ 3 ทั้งหมด
- [ ] สร้างโครงโฟลเดอร์ทั้งหมดพร้อม `_category_.json` ของแต่ละหมวด
- [ ] ตั้ง `sidebars.ts` แบบ autogenerated
- [ ] เขียน `scripts/validate-frontmatter.mjs`, `check-contrast.mjs`, `check-prose.mjs`
- [ ] เพิ่ม LICENSE ทั้ง 3 ไฟล์
- [ ] ตั้ง GitHub Actions: build + validate + contrast + prose
- [ ] Deploy ขึ้น Cloudflare Pages ให้เห็นหน้าเปล่าออนไลน์ได้จริง

**Definition of done ของ Phase 1:** เปิด URL จริงแล้วเห็นหน้าเว็บภาษาไทย ฟอนต์ถูก ไม่มี error ใน console และ CI เขียว

---

### Phase 2 — Component หลัก
- [ ] C1 `<Callout>` ทุก type
- [ ] C2 `<PythonRunner>` (Web Worker + นาฬิกาสองตัว + lazy load + stdin buffer)
- [ ] C3 `<Quiz>`
- [ ] C4 `<TrackBadge>` + swizzle DocItem + plugin ที่ทำตาราง id→url
- [ ] สร้างหน้า `docs/_playground.mdx` ที่แสดง component ทุกตัวไว้ทดสอบ (ไม่ publish)

**Definition of done:** เปิดหน้า playground บนมือถือจริงแล้วทุก component ใช้งานได้ ไม่ล้นจอ และเดินด้วยคีย์บอร์ดได้ครบ

---

### Phase 3 — เนื้อหานำร่อง
- [ ] เขียนบท 0.1–0.11 ตาม `CURRICULUM.md`
- [ ] C5 `<BinaryConverter>` (ต้องมีก่อนบท 0.2)
- [ ] เขียน `docs/intro.mdx`, `docs/roadmap.mdx`, `docs/appendix/glossary.mdx`
- [ ] เขียนเฉลยใน `docs/appendix/solutions/` ครบทุกบท
- [ ] ทำ spike เรื่อง search ภาษาไทย (หัวข้อ 1.1) แล้วบันทึกผลลงไฟล์นี้

**หยุดตรงนี้แล้วเอาไปทดลองใช้จริงก่อน** — อย่าเพิ่งไป Stage 1

---

### Phase 4 เป็นต้นไป
รอ feedback จากการใช้จริงก่อน แล้วค่อยขยายทีละแกน (ไม่ใช่ทีละชั้นปี)
ตัดสินใจเรื่อง Marp ตอนนี้ (หัวข้อ 1.2)

---

## 6. กติกาการทำงาน

### Git
- Branch ต่อหนึ่งหน่วยงาน: `feat/python-runner`, `content/stage-0-lesson-3`
- Commit message ภาษาอังกฤษ, imperative: `add PythonRunner web worker timeout`
- **1 commit = 1 เรื่อง** ห้ามรวมงาน component กับงานเนื้อหาใน commit เดียว

### สิ่งที่ต้องทำทุกครั้งก่อนบอกว่างานเสร็จ
1. `npm run build` ผ่านโดยไม่มี warning
2. `npm run check` (validate + contrast + prose) ผ่าน
3. เปิดดูจริงที่ความกว้าง 375px (มือถือ) และ 1440px
4. ทดสอบทั้งโหมดสว่างและมืด
5. เดินด้วยคีย์บอร์ดอย่างเดียวได้ครบ และเห็น focus ring ทุกจุด
6. โค้ดตัวอย่างทุกชิ้นใน `code/` ต้องรันได้จริง — **ห้ามเขียนโค้ดที่ยังไม่ได้ทดสอบลงบทเรียน**
7. ตรวจ console ไม่มี error

### สิ่งที่ต้องถามก่อนทำ
- เพิ่ม npm dependency ใหม่
- เปลี่ยนโครงสร้างโฟลเดอร์
- เปลี่ยน design token
- ตัดสินใจเรื่องขอบเขตเนื้อหา (เช่น "บทนี้ควรรวมเรื่อง X ไหม")

### สิ่งที่ห้ามทำเด็ดขาด
- ❌ hardcode สี — ใช้ CSS variable เท่านั้น
- ❌ เขียนโค้ดตัวอย่างโดยไม่รันทดสอบ
- ❌ ใช้ `line-height` ต่ำกว่า 1.75 กับเนื้อหาไทย
- ❌ โหลด Pyodide ตอนเปิดหน้า
- ❌ ใช้ `SharedArrayBuffer` / เปิด COOP+COEP
- ❌ โหลดฟอนต์จาก Google Fonts CDN
- ❌ ใช้หน่วย `ch` กำหนดความกว้างข้อความไทย
- ❌ สร้างบทเรียนใหม่โดยไม่อ่าน `CONTRIBUTING.md` และ `CURRICULUM.md`
- ❌ แต่งเนื้อหาข้อเท็จจริงทางเทคนิคขึ้นเอง — ถ้าไม่แน่ใจให้ใส่ `{/* TODO: verify */}` แล้วบอกผู้ใช้

---

## 7. Frontmatter Schema (บังคับทุกไฟล์)

```yaml
---
id: how-computers-think            # ไม่มีเลขนำหน้า — เลขอยู่ในชื่อไฟล์เท่านั้น
slug: /how-computers-think         # URL ถาวร ขึ้นต้นด้วย / เสมอ ห้ามเปลี่ยนหลัง publish
title: "คอมพิวเตอร์คิดยังไง"         # ใส่ quote เสมอ (ไทยมีอักขระพิเศษ)
description: "ทำไมคอมพิวเตอร์ถึงใช้แค่ 0 กับ 1 และมันแทนตัวเลขทุกตัวได้ยังไง"
track: HARD                        # PROG|MATH|HARD|DATA|NET|PROF
stage: 0                           # 0-4
difficulty: 1                      # 1-5
duration: 90                       # นาที ต้องอยู่ในช่วง 60-120
prerequisites: []                  # array ของ id บทอื่น ต้องมีอยู่จริงและห้ามเป็นวงจรวน
status: draft                      # draft|review|published
last_reviewed: 2026-08-14          # วันที่ตรวจความถูกต้องล่าสุด
---
```

### กฎที่เปลี่ยนจากของเดิม พร้อมเหตุผล

| ฟิลด์ | เปลี่ยนอะไร | ทำไม |
|---|---|---|
| `id` | ตัดเลขนำหน้าออก | ถ้า `id` มีเลข URL จะเป็น `/01-...` พอแทรกบทใหม่หรือสลับลำดับ URL เปลี่ยน ลิงก์เก่าตายหมด — โปรเจกต์นี้ตั้งใจอยู่ 5 ปี |
| `slug` | **เพิ่มใหม่ ต้องขึ้นต้นด้วย `/`** | ล็อก URL ถาวรแยกจากชื่อไฟล์ **ถ้าไม่มี `/` นำหน้า Docusaurus จะยังเอาชื่อโฟลเดอร์มาต่อหน้าให้** เช่นได้ `/docs/stage-0-foundations/how-computers-think` ซึ่งแปลว่าย้ายบทข้ามโฟลเดอร์เมื่อไหร่ลิงก์ตายเมื่อนั้น — ผิดวัตถุประสงค์ที่เพิ่มฟิลด์นี้มาแต่แรก (ตรวจพบตอนทดสอบ TrackBadge) |
| `sidebar_position` | **ตัดออก** | ซ้ำซ้อนกับเลขนำหน้าชื่อไฟล์ ซึ่ง autogenerated sidebar ใช้เรียงอยู่แล้ว มีสองแหล่งความจริงเดี๋ยวก็ขัดกัน |
| `description` | **เพิ่มใหม่ บังคับ** | Docusaurus ใช้ทำ meta description — คอร์สฟรีต้องให้คนหาเจอใน Google |
| `last_reviewed` | **เพิ่มใหม่ บังคับ** | เนื้อหาเทคโนโลยีเน่าตามเวลา ต้องรู้ว่าบทไหนควรตรวจใหม่ |

### `scripts/validate-frontmatter.mjs` ต้องตรวจทั้งหมดนี้ และ fail build ถ้าผิด
1. ทุกฟิลด์บังคับมีครบ และชนิดข้อมูลถูก
2. `id` ตรงกับชื่อไฟล์ที่ตัดเลขนำหน้าออกแล้ว
3. `track` / `status` อยู่ในชุดค่าที่อนุญาต
4. `stage` 0–4, `difficulty` 1–5, `duration` 60–120
5. **`prerequisites` ทุกตัวชี้ไปยัง `id` ที่มีอยู่จริง**
6. **ไม่มีวงจรวนใน dependency graph** — ที่ 130 บทจะเกิดโดยไม่ตั้งใจแน่นอน
7. **ทุกบทที่ `status: published` ต้องมีไฟล์เฉลยคู่กันใน `docs/appendix/solutions/`**
8. `slug` ไม่ซ้ำกับบทอื่น

---

## 8. Accessibility (ไม่ใช่ของแถม)

- Contrast ratio ≥ 4.5:1 ทุกคู่สี ตรวจทั้งสองโหมด — **บังคับด้วย `scripts/check-contrast.mjs` ใน CI**
- ทุก interactive component ใช้คีย์บอร์ดได้ครบ (Tab, Enter, Space, Escape)
- **Focus ring ต้องเห็นชัด** ใช้ `--rk-focus` ห้ามเขียน `outline: none` โดยไม่มีตัวแทน
- Code editor ต้องออกจาก Tab trap ได้ (Escape แล้ว Tab) และมี textarea สำรองสำหรับ screen reader
- ทุกภาพ/ไดอะแกรมมี `alt` ภาษาไทยที่บรรยายเนื้อหา ไม่ใช่แค่ชื่อไฟล์
- ห้ามสื่อความหมายด้วยสีอย่างเดียว
- `prefers-reduced-motion` ปิด animation ทั้งหมด

### ศัพท์ภาษาอังกฤษที่แทรกในข้อความไทย

คอร์สนี้แทรกศัพท์อังกฤษทุกย่อหน้าตามกฎ `CONTRIBUTING.md` §3.1 ซึ่งทำให้ screen reader อ่านคำอังกฤษด้วยเสียงไทย ฟังไม่ออกเลย

**เมื่อศัพท์อังกฤษยาวเกิน 1 คำหรือเป็นชื่อเฉพาะ** ให้ครอบด้วย `<span lang="en">`:

```mdx
หน่วยความจำ (<span lang="en">memory</span>) คือ...
```

ศัพท์คำเดียวสั้น ๆ ที่กลายเป็นคำทับศัพท์ไปแล้ว (เช่น `bit`, `byte`) ไม่ต้องครอบ

---

## 9. Performance

### งบขนาดไฟล์ — ตัวเลขที่วัดจากของจริงแล้ว

> ⚠️ อย่าเดาตัวเลขในหัวข้อนี้ ตัวเลขชุดแรกของโปรเจกต์ ("< 200KB รวมทุกอย่าง") ผิด
> และชุดที่สอง ("JS < 180KB") ก็ยังผิด ตัวเลขข้างล่างนี้**วัดจาก build จริง** ที่หน้า `/docs/roadmap`
> ถ้าจะแก้ ให้วัดใหม่ ไม่ใช่ประมาณเอา

| ก้อน | วัดได้จริง (gzip) | งบ | สถานะ |
|---|---|---|---|
| **JS — หน้าที่ไม่มีไดอะแกรม** | **164 KB** | ≤ 200 KB | ผ่าน |
| JS — หน้าที่มีไดอะแกรม (บวก mermaid) | ~305 KB | — | จ่ายเฉพาะหน้าที่ใช้ |
| CSS | 15 KB | ≤ 30 KB | ผ่าน |
| ฟอนต์เนื้อหา — โหลดจริงต่อหน้า | 59 KB | ≤ 150 KB | ผ่านสบาย |
| ฟอนต์เนื้อหา — ที่ส่งขึ้นเว็บทั้งหมด | 73 KB | — | 5 ไฟล์ (mono โหลดต่อเมื่อมีโค้ด) |
| KaTeX CSS | 3 KB | — | โหลดทุกหน้า |
| ฟอนต์ KaTeX | 253 KB | — | โหลดต่อเมื่อมีสูตรจริง |
| Pyodide, sql.js | ไม่นับ | — | lazy load |

### ✅ ต้นทุนของ Mermaid — แก้แล้ว (2026-08-14)

**ปัญหาเดิม:** `@docusaurus/theme-mermaid` ลงทะเบียนตัวจัดการ code block ระดับ global
ทำให้ทุกหน้าอ้างถึงมัน webpack จึงยก dependency ร่วมของ mermaid (d3 และอื่น ๆ) ออกมาเป็น
chunk ชื่อ `common` ขนาด ~141 KB gzip ที่ถูกโหลด **ทุกหน้า** แม้หน้าที่ไม่มีไดอะแกรมสักอัน

**สิ่งที่ทดลองแล้วไม่ได้ผล:** เปลี่ยนไปเขียน component ที่ `await import('mermaid')` เอง
— ยังเกิด chunk `common` เหมือนเดิม เพราะต้นเหตุอยู่ที่กติกาการจัดกลุ่ม chunk ของ webpack
ไม่ใช่วิธี import

**สิ่งที่ได้ผล — ใช้สองอย่างคู่กัน:**

1. ตัด `@docusaurus/theme-mermaid` ออก ใช้ `<Diagram>` (`src/components/Diagram/`) ที่ import
   mermaid แบบ dynamic จากที่เดียวแทน
2. เขียน plugin `rk-bundle-tuning` ใน `docusaurus.config.ts` กัน mermaid, d3 และเพื่อน
   ออกจาก cacheGroup ชื่อ `common` ของ Docusaurus

ผลที่วัดได้:

| | หน้าที่ไม่มีไดอะแกรม | หน้าที่มีไดอะแกรม |
|---|---|---|
| ก่อนแก้ | 305 KB | 305 KB |
| หลังแก้ | **164 KB** | ~305 KB |

**ห้ามเอา `@docusaurus/theme-mermaid` กลับมา** และห้ามลบ plugin `rk-bundle-tuning`
**วิธีตรวจว่ายังถูกอยู่:** หลัง build ต้องไม่มีไฟล์ `build/assets/js/common.*.js`

### กติกาอื่น
- Lighthouse Performance ≥ 90 บนมือถือ — **ยังไม่ได้วัด** ต้องวัดหลัง deploy จริง
- ฟอนต์ใช้ `font-display: swap` และ `<link rel="preload">` เฉพาะน้ำหนัก 400
- รูปทั้งหมดเป็น WebP มี width/height กำหนดไว้ (กัน layout shift)
- **KaTeX CSS โหลดทุกหน้า (3 KB gzip)** — Docusaurus ไม่รองรับการโหลด stylesheet เฉพาะบางหน้า
  แต่ **ไฟล์ฟอนต์** ของ KaTeX (253 KB) เบราว์เซอร์จะโหลดต่อเมื่อมีสูตรบนหน้านั้นจริง จึงยอมรับได้

---

## 10. CI — กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะหายไปใน 3 เดือน

| กฎ | ตรวจด้วย |
|---|---|
| frontmatter ครบและถูกชนิด | `validate-frontmatter.mjs` |
| prerequisites มีจริง + ไม่วนซ้ำ | `validate-frontmatter.mjs` |
| ทุกบท published มีเฉลย | `validate-frontmatter.mjs` |
| ลิงก์ภายในไม่เสีย | `onBrokenLinks: 'throw'` ของ Docusaurus |
| **บทที่เป็น draft คอมไพล์ผ่าน** | `check-drafts.mjs` — ดูกล่องด้านล่าง |
| ไม่มี chunk `common` ที่ทุกหน้าต้องโหลด | `check-bundle.mjs` (รันหลัง build) |
| ไม่มีสำเนาฟอนต์ที่ถูก hash | `check-bundle.mjs` (รันหลัง build) |
| `@font-face` ไม่อยู่ใต้ `src/` | `check-prose.mjs` |
| contrast ≥ 4.5:1 ทั้งสองโหมด | `check-contrast.mjs` |
| ไม่ hardcode สีนอก custom.css | `check-prose.mjs` |
| ทุกบทมี `<Callout type="misconception">` ≥ 1 | `check-prose.mjs` |
| ไม่มีคำว่า "ง่ายมาก" / "แค่นี้เอง" / "ชัดเจนอยู่แล้ว" | `check-prose.mjs` |
| งบคำต่อบท | `check-prose.mjs` |

### ❗ `npm run build` ไม่ตรวจบทที่เป็น draft

`docusaurus build` เป็นโหมด production ซึ่ง **ข้ามไฟล์ที่ `draft: true` ทั้งหมด**
บทที่ยังเขียนไม่เสร็จจึงมี MDX ที่คอมไพล์ไม่ผ่านได้ โดย CI ยังเขียวอยู่
กว่าจะรู้ก็ตอนเลื่อนสถานะเป็น `published` ซึ่งอาจเป็นเดือนถัดไป

**เจอจริงตอนเขียนบท 0.2** — template literal ที่ขึ้นบรรทัดใหม่ที่คอลัมน์ 1
ขณะอยู่ในรายการลำดับเลข ทำให้ MDX พัง แต่ `npm run build` ขึ้น `SUCCESS`

`scripts/check-drafts.mjs` แก้ช่องโหว่นี้ด้วยการสั่ง dev server (ซึ่งคอมไพล์ draft ด้วย)
แล้วอ่านผลการคอมไพล์ **ห้ามลบขั้นตอนนี้ออกจาก CI**

กับดัก MDX ที่เจอบ่อยที่สุด: ถ้าใส่ JSX ในรายการ (`1.` `2.` `-`)
ห้ามให้ template literal ขึ้นบรรทัดใหม่ที่คอลัมน์ 1 — ใช้ `{"...\n..."}` แทน

---

## 11. คำสั่งเริ่มงานที่แนะนำให้ใช้กับ Claude Code

> อ่าน CLAUDE.md, CONTRIBUTING.md และ CURRICULUM.md
> แล้วทำ Phase 1 ให้ครบทุกข้อ ตามด้วยรายงานว่าเหลืออะไรต้องตัดสินใจ
