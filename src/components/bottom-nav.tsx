"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIconName = "places" | "plans" | "saved" | "profile";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  active: (pathname: string) => boolean;
};

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "places") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 5.5 8.8 3l6.4 2.5L20.5 3v15.5L15.2 21l-6.4-2.5-5.3 2.5V5.5Z" />
        <path d="M8.8 3v15.5M15.2 5.5V21" />
      </svg>
    );
  }

  if (name === "plans") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M7.5 2.8v4.4M16.5 2.8v4.4M3.5 9.2h17" />
      </svg>
    );
  }

  if (name === "saved") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h9A2.5 2.5 0 0 1 19 4.5V22l-7-4-7 4V4.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4.5 21v-1.5A7.5 7.5 0 0 1 12 12a7.5 7.5 0 0 1 7.5 7.5V21" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/places",
    label: "สถานที่",
    icon: "places",
    active: (pathname) => pathname === "/" || pathname.startsWith("/places"),
  },
  {
    href: "/plans",
    label: "วางแผน",
    icon: "plans",
    active: (pathname) => pathname.startsWith("/plans"),
  },
  {
    href: "/saved",
    label: "บันทึก",
    icon: "saved",
    active: (pathname) => pathname.startsWith("/saved"),
  },
  {
    href: "/profile",
    label: "โปรไฟล์",
    icon: "profile",
    active: (pathname) => pathname.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      {NAV_ITEMS.map((item) => {
        const isActive = item.active(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
