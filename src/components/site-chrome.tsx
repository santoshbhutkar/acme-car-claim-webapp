"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClaimantHeader() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/file-claim", label: "File a claim" },
    { href: "/track", label: "Track" },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-mark">
          <span className="brand-mark__glyph" aria-hidden="true" />
          <span className="brand-mark__text">ACME</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "is-active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function AdjusterHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header site-header--adjuster">
      <div className="site-header__inner">
        <Link href="/adjuster" className="brand-mark">
          <span className="brand-mark__glyph" aria-hidden="true" />
          <span className="brand-mark__text">ACME · Adjuster</span>
        </Link>
        <nav className="site-nav" aria-label="Adjuster">
          <Link
            href="/adjuster"
            className={pathname === "/adjuster" || pathname.startsWith("/adjuster/") ? "is-active" : undefined}
          >
            Open claims
          </Link>
        </nav>
      </div>
    </header>
  );
}
