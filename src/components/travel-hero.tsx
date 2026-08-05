import Link from "next/link";

type Props={title:string;subtitle?:string;backHref?:string;compact?:boolean;editable?:boolean;editHref?:string};
export function TravelHero({title,subtitle,backHref,compact=false,editable=false,editHref}:Props){return <header className={`travel-hero${compact?" travel-hero-compact":""}`}>
  <div className="travel-hero-photo" aria-hidden="true"/><div className="travel-hero-shade" aria-hidden="true"/>
  <div className="hero-overlay"><div className="hero-topline"><div className="hero-brand-row">{backHref&&<Link href={backHref} className="hero-round-button" aria-label="ย้อนกลับ">←</Link>}<span className="hero-brand"><span className="mountain-mark">⌁</span>TravelTank300</span></div><div className="hero-actions"><button type="button" aria-label="การแจ้งเตือน">♧</button><span className="hero-avatar">ส</span></div></div><div className="hero-copy"><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{editable&&editHref&&<Link className="hero-cover-action" href={editHref}>✎ แก้ไขข้อมูล</Link>}</div>
</header>}
