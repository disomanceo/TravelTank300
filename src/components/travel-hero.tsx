import Link from "next/link";
import { BackIcon, BellIcon, CameraIcon, MountainIcon } from "./icons";

type TravelHeroProps = { title: string; subtitle?: string; backHref?: string; compact?: boolean; editable?: boolean; editHref?: string };
export function TravelHero({ title, subtitle, backHref, compact=false, editable=false, editHref }: TravelHeroProps){return <header className={`travel-hero${compact?" travel-hero-compact":""}`}>
  <div className="travel-hero-photo" aria-hidden="true"/><div className="travel-hero-shade" aria-hidden="true"/>
  <div className="hero-overlay"><div className="hero-topline"><div className="hero-brand-row">{backHref&&<Link href={backHref} className="hero-round-button" aria-label="ย้อนกลับ"><BackIcon/></Link>}<span className="hero-brand"><MountainIcon/>TravelTank300</span></div><div className="hero-actions"><button type="button" aria-label="การแจ้งเตือน"><BellIcon/></button><span className="hero-avatar">ส</span></div></div><div className="hero-copy"><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{editable&&editHref&&<Link className="hero-cover-action" href={editHref}><CameraIcon/><span>เพิ่มหรือเปลี่ยนรูป</span></Link>}</div>
</header>}
