import Link from "next/link";
import { TravelHero } from "@/components/travel-hero";

export default function SavedPage() {
  return (
    <main className="app-shell">
      <TravelHero title="บันทึกของฉัน" subtitle="รวมสถานที่และความทรงจำที่บันทึกไว้" />
      <section className="content-area">
        <div className="empty-state saved-empty-state">
          <span className="empty-state-icon" aria-hidden="true">▱</span>
          <strong>บันทึกการเดินทางของคุณ</strong>
          <p>สถานที่ที่เพิ่มไว้จะพบได้จากเมนูสถานที่</p>
          <Link className="primary" href="/places">เปิดรายการสถานที่</Link>
        </div>
      </section>
    </main>
  );
}
