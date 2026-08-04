import { BellIcon, MountainIcon } from "./icons";
export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="app-header"><div><p className="brand"><MountainIcon/> TravelTank300</p><h1>{title}</h1>{subtitle && <p className="header-subtitle">{subtitle}</p>}</div><div className="header-actions"><button aria-label="การแจ้งเตือน"><BellIcon/></button><div className="avatar">ส</div></div></header>;
}
