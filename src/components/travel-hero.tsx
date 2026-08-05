import Link from "next/link";

type TravelHeroProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  editHref?: string;
  compact?: boolean;
  editable?: boolean;
};

export function TravelHero({
  title,
  subtitle,
  backHref,
  editHref,
  compact = false,
  editable = false,
}: TravelHeroProps) {
  const showEdit = Boolean(editHref) && (editable || Boolean(editHref));

  return (
    <header className={`hero${compact ? " hero-compact" : ""}`}>
      <div>
        {backHref ? <Link href={backHref}>←</Link> : <span aria-hidden="true" />}
        <span>TravelTank300</span>
        {showEdit && editHref ? <Link href={editHref}>แก้ไข</Link> : <span aria-hidden="true" />}
      </div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
