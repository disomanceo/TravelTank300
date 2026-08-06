import Link from "next/link";
import { TravelHero } from "@/components/travel-hero";

export default function ProfilePage() {
  return (
    <main className="app-shell">
      <TravelHero title="โปรไฟล์" subtitle="Travel Tank300 · By Tank300" />
      <section className="content-area profile-content">
        <section className="profile-card">
          <div className="profile-avatar">ส</div>
          <div>
            <h2>สุธน พุทธรัตน์</h2>
            <p>นักเดินทางสายออฟโรด</p>
          </div>
        </section>
        <div className="profile-menu">
          <Link href="/places"><span>ข้อมูลการเดินทาง</span><b>›</b></Link>
          <Link href="/plans"><span>แผนการเดินทาง</span><b>›</b></Link>
          <Link href="/saved"><span>บันทึกของฉัน</span><b>›</b></Link>
        </div>
      </section>
    </main>
  );
}
