import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// ⚠️ TODO: แก้สองค่านี้ให้ตรงกับของจริงก่อน deploy
//    SITE_URL — โดเมนที่ใช้จริงบน Cloudflare Pages
//    REPO_URL — GitHub repo สำหรับปุ่ม "แก้ไขหน้านี้"
const SITE_URL = 'https://rakthan.pages.dev';
const REPO_URL = 'https://github.com/wisach250212/rakthan';

const config: Config = {
  title: 'RAKTHAN',
  tagline: 'รากฐานวิศวกรรมคอมพิวเตอร์ ตั้งแต่บิตแรกถึงปีสุดท้าย',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
    faster: true,
  },

  url: SITE_URL,
  baseUrl: '/',

  // ลิงก์ภายในที่เสียต้องทำให้ build พัง — ไม่ต้องใช้ link checker แยกสำหรับลิงก์ภายใน
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  onBrokenAnchors: 'throw',

  // lang="th" มาจากตรงนี้ และเบราว์เซอร์ต้องใช้มันเพื่อตัดบรรทัดภาษาไทย
  // ด้วยพจนานุกรม — ห้ามลบหรือเปลี่ยนเป็น en
  i18n: {
    defaultLocale: 'th',
    locales: ['th'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${REPO_URL}/tree/main/`,
          showLastUpdateTime: true,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        // ไม่มี blog — โปรเจกต์นี้เป็นคอร์ส ไม่ใช่เว็บบล็อก
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css', './src/css/thai-typography.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  // KaTeX CSS แบบ self-host (ห้ามใช้ CDN — เหตุผลเดียวกับฟอนต์ ดู CLAUDE.md 3.2)
  // ไฟล์ฟอนต์ของ KaTeX เองจะถูกโหลดต่อเมื่อมีสูตรคณิตบนหน้านั้นจริง ๆ
  // ดังนั้นหน้าที่ไม่มีสูตรจึงเสียแค่ CSS ~24KB (ประมาณ 7KB หลัง gzip)
  stylesheets: [
    {
      href: '/katex/katex.min.css',
      type: 'text/css',
    },
  ],

  headTags: [
    // preload เฉพาะน้ำหนัก 400 ของ subset ไทย ซึ่งเป็นสิ่งที่ผู้เรียนเห็นก่อนเสมอ
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/plex-sans-thai-thai-400.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/plex-sans-thai-latin-400.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
  ],

  themeConfig: {
    image: 'img/logo.svg',

    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },

    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },

    navbar: {
      title: 'RAKTHAN',
      logo: {
        alt: 'โลโก้ Rakthan',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'courseSidebar',
          position: 'left',
          label: 'บทเรียน',
        },
        { to: '/docs/roadmap', label: 'แผนการเรียน', position: 'left' },
        {
          href: REPO_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'เนื้อหา',
          items: [
            { label: 'เริ่มต้นที่นี่', to: '/docs/intro' },
            { label: 'แผนการเรียน', to: '/docs/roadmap' },
            { label: 'อภิธานศัพท์', to: '/docs/appendix/glossary' },
          ],
        },
        {
          title: 'ร่วมพัฒนา',
          items: [
            { label: 'GitHub', href: REPO_URL },
            { label: 'แจ้งข้อผิดพลาด', href: `${REPO_URL}/issues` },
          ],
        },
      ],
      copyright:
        'เนื้อหาเผยแพร่ภายใต้สัญญาอนุญาต CC BY-SA 4.0 · โค้ดภายใต้ MIT · RAKTHAN',
    },

    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['bash', 'c', 'sql', 'verilog'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
