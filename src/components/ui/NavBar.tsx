'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./NavBar.module.scss";
import { useSupabase } from "../providers/SupabaseProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/wishlist", label: "Wishlist" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, session, loading, ready } = useSupabase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logo}>
          <span>VinylBox</span>
          <span className={styles.badge}>beta</span>
        </Link>

        <div className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${
                pathname === link.href ? styles.active : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          {!session && (
            <Link href="/login" className={`${styles.button} ${styles.primary}`}>
              Login
            </Link>
          )}
          {session && (
            <>
              <span className={styles.button}>
                {loading
                  ? "Loading..."
                  : session.user.email ?? session.user.identities?.[0]?.identity_data?.email ??
                    "Signed in"}
              </span>
              <button className={styles.button} onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
          {!ready && (
            <span className={styles.button}>Set Supabase env vars</span>
          )}
        </div>
      </div>
    </nav>
  );
}


