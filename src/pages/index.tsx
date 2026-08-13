import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type { ReactNode } from 'react';

import styles from './index.module.css';

function Hero(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroTagline}>{siteConfig.tagline}</p>
        <p className={styles.heroLead}>
          คอร์สวิศวกรรมคอมพิวเตอร์ภาษาไทย ที่เริ่มจากศูนย์จริง ๆ
          <br />
          ไม่ต้องเคยเขียนโค้ด ไม่ต้องติดตั้งอะไร — โค้ดทุกบรรทัดรันได้ในเบราว์เซอร์
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} to="/docs/intro">
            เริ่มเรียน
          </Link>
          <Link className={styles.secondaryButton} to="/docs/roadmap">
            ดูแผนการเรียน
          </Link>
        </div>
      </div>
    </header>
  );
}

const PRINCIPLES = [
  {
    title: 'ปัญหาก่อนคำนิยาม',
    body: 'เราให้คุณเจอปัญหาก่อน แล้วแนวคิดจะโผล่มาเป็นคำตอบของปัญหานั้น ไม่ใช่ท่องนิยามแล้วค่อยหาที่ใช้',
  },
  {
    title: 'ดักความเข้าใจผิด',
    body: 'ทุกบทมีกล่อง "คนมักเข้าใจผิดว่า..." เพราะความเข้าใจผิดที่ไม่ถูกแก้วันนี้ จะไปพังเอาตอนเรียนเรื่องที่ยากกว่าอีกสองปีข้างหน้า',
  },
  {
    title: 'ได้ลงมือทำทุกบท',
    body: 'ไม่มีบทไหนเป็นทฤษฎีล้วน แม้แต่บทฮาร์ดแวร์ก็มีวงจรให้กดเล่น และบทคณิตศาสตร์ก็มีโค้ดให้รัน',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="รากฐานวิศวกรรมคอมพิวเตอร์"
      description="คอร์สวิศวกรรมคอมพิวเตอร์ภาษาไทย ตั้งแต่ไม่เคยเขียนโค้ด จนถึงระดับปริญญาตรีปี 4"
    >
      <Hero />
      <main className="container">
        <section className={styles.principles}>
          {PRINCIPLES.map((p) => (
            <div key={p.title} className={styles.principleCard}>
              <Heading as="h2" className={styles.principleTitle}>
                {p.title}
              </Heading>
              <p className={styles.principleBody}>{p.body}</p>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
}
