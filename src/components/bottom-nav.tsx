import Link from "next/link";
import { BookIcon, CalendarIcon, MapIcon, UserIcon } from "./icons";

export function BottomNav({ active }: { active: "places" | "plans" }) {
  const links = [
    { href: "/places", label: "สถานที่", key: "places", icon: MapIcon },
    { href: "/plans", label: "วางแผน", key: "plans", icon: CalendarIcon },
    { href: "/places/new", label: "บันทึก", key: "journal", icon: BookIcon },
    { href: "#", label: "โปรไฟล์", key: "profile", icon: UserIcon },
  ];
  return <nav className="bottom-nav" aria-label="เมนูหลัก">{links.map(({href,label,key,icon:Icon}) => <Link key={key} href={href} className={active===key?"nav-item active":"nav-item"}><Icon/><span>{label}</span></Link>)}</nav>;
}
