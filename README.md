# RAKTHAN (รากฐาน)

> รากฐานวิศวกรรมคอมพิวเตอร์ ตั้งแต่บิตแรกถึงปีสุดท้าย
> Computer Engineering from the ground up

คอร์สเรียนวิศวกรรมคอมพิวเตอร์ภาษาไทย ตั้งแต่ระดับผู้ไม่เคยเขียนโค้ด จนถึงระดับปริญญาตรีปี 4
เป็น static site ล้วน โค้ดทุกบรรทัดที่ผู้เรียนรันทำงานในเบราว์เซอร์ของผู้เรียนเอง

🌐 **[rakthan.pages.dev](https://rakthan.pages.dev)**

## เอกสารของโปรเจกต์ — อ่านก่อนเริ่มงาน

| ไฟล์ | ใช้เมื่อ |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | ทุกครั้งก่อนเริ่มงาน — การตัดสินใจทางเทคนิค design token ข้อกำหนด component |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | ก่อนเขียนหรือแก้บทเรียน — หลักการสอน โครงบท กติกาภาษา |
| [`CURRICULUM.md`](CURRICULUM.md) | ก่อนตัดสินใจว่าจะเขียนบทอะไร — รายชื่อบทและลำดับ dependency |

## เริ่มใช้งาน

```bash
npm install
npm start
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | เปิด dev server |
| `npm run build` | บิลด์เว็บจริง ต้องผ่านโดยไม่มี warning |
| `npm run check` | ตรวจกฎทั้งหมด (frontmatter, คอนทราสต์, ร้อยแก้ว) |
| `npm run new-lesson -- --dir ... --num ... --id ...` | สร้างบทใหม่พร้อมไฟล์เฉลย |

## กฎที่บังคับด้วยเครื่อง

กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะหายไปใน 3 เดือน — CI จึงตรวจสิ่งเหล่านี้ทุก push

| กฎ | สคริปต์ |
|---|---|
| frontmatter ครบ, prerequisites มีจริง, ไม่มีวงจรวน, บทที่ published มีเฉลย | `scripts/validate-frontmatter.mjs` |
| คอนทราสต์ทุกคู่สี ≥ WCAG AA ทั้งโหมดสว่างและมืด | `scripts/check-contrast.mjs` |
| คำต้องห้าม, ต้องมี misconception callout, งบคำ, ห้าม hardcode สี | `scripts/check-prose.mjs` |
| ลิงก์ภายในไม่เสีย | `onBrokenLinks: 'throw'` ของ Docusaurus |

## สถานะ

| ส่วน | สถานะ |
|---|---|
| Phase 1 — วางฐาน | ✅ เสร็จ — deploy ขึ้น Cloudflare Pages แล้ว |
| Phase 2 — Component หลัก | ⬜ ยังไม่เริ่ม |
| Phase 3 — เนื้อหา Stage 0 (11 บท) | ⬜ ออกแบบครบแล้ว ยังไม่เขียน |

## สัญญาอนุญาต

- เนื้อหาใน `docs/` และ `slides/` — [CC BY-SA 4.0](LICENSE-CONTENT)
- โค้ดใน `src/`, `code/`, `scripts/` — [MIT](LICENSE-CODE)

ดูรายละเอียดและทรัพย์สินของบุคคลที่สามที่ [`LICENSE`](LICENSE)
