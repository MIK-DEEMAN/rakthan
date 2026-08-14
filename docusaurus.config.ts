import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// ⚠️ TODO: SITE_URL ยังเป็นค่าเดา — แก้ให้ตรงกับโดเมนจริงหลังตั้ง Cloudflare Pages เสร็จ
//    (ค่าเริ่มต้นของ Cloudflare คือ https://<ชื่อโปรเจกต์>.pages.dev)
const SITE_URL = 'https://rakthan.pages.dev';
const REPO_URL = 'https://github.com/MIK-DEEMAN/rakthan';

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
  onBrokenAnchors: 'throw',

  // lang="th" มาจากตรงนี้ และเบราว์เซอร์ต้องใช้มันเพื่อตัดบรรทัดภาษาไทย
  // ด้วยพจนานุกรม — ห้ามลบหรือเปลี่ยนเป็น en
  i18n: {
    defaultLocale: 'th',
    locales: ['th'],
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  // ไม่ใช้ @docusaurus/theme-mermaid — วัดแล้วพบว่ามันสร้าง chunk ชื่อ "common"
  // ขนาด ~141KB (gzip) ที่ทุกหน้าต้องโหลด แม้หน้านั้นไม่มีไดอะแกรมเลย
  // ใช้ <Diagram> ใน src/components/Diagram แทน ซึ่งโหลด mermaid เฉพาะหน้าที่ใช้จริง
  // ดู CLAUDE.md หัวข้อ 9

  plugins: [
    // Docusaurus ตั้ง cacheGroup ชื่อ "common" ให้ยกโมดูลที่ถูกใช้ร่วมกันหลาย chunk
    // ออกมาเป็นก้อนเดียว ผลคือ dependency ภายในของ mermaid ถูกยกออกมาด้วย
    // แล้วกลายเป็นก้อน ~141KB (gzip) ที่ทุกหน้าต้องโหลด แม้ไม่มีไดอะแกรม
    // ตรงนี้กัน mermaid และเพื่อนออกจาก cacheGroup นั้น ให้อยู่ใน chunk ของตัวเอง
    function bundleTuning() {
      return {
        name: 'rk-bundle-tuning',
        configureWebpack(_config: unknown, isServer: boolean) {
          if (isServer) return {};
          const HEAVY = /[\\/]node_modules[\\/](mermaid|@mermaid-js|d3|d3-[^\\/]+|cytoscape|dagre[^\\/]*|khroma|langium|roughjs|katex)[\\/]/;
          return {
            optimization: {
              splitChunks: {
                cacheGroups: {
                  common: {
                    // รับเป็น unknown แล้วแคสต์ เพราะ type ของ webpack.Module
                    // ไม่ได้ประกาศ resource ไว้ใน type ที่ Docusaurus ส่งออกมา
                    test: (mod: unknown) =>
                      !HEAVY.test((mod as { resource?: string } | null)?.resource ?? ''),
                  },
                },
              },
            },
          };
        },
      };
    },
  ],

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
    // @font-face ต้องมาจาก static/ ไม่ใช่ src/css/ ไม่งั้น webpack จะ hash ชื่อไฟล์ฟอนต์
    // แล้ว preload ด้านล่างจะชี้คนละไฟล์กับที่ CSS เรียก → โหลดซ้ำสองชุด
    {
      href: '/fonts/fonts.css',
      type: 'text/css',
    },
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
