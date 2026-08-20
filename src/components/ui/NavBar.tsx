"use client";

import Link from "next/link";
import styles from "./NavBar.module.scss";

export default function NavBar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logo}>
          <span>VINYLBOX</span>
          <span className={styles.badge}>collection room</span>
        </Link>
        <div className={styles.links}>
          <Link href="/#collection" className={styles.link}>My shelf</Link>
          <Link href="/#find" className={styles.link}>Find records</Link>
        </div>
        <div className={styles.actions}>
          <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noreferrer" className={`${styles.button} ${styles.primary}`}>Get a Discogs key</a>
        </div>
      </div>
    </nav>
  );
}
