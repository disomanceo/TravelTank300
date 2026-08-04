export type Place = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  subdistrict: string;
  district: string;
  province: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  visitedDate: string;
  duration: string;
  budget: string;
  status: "ไปแล้ว" | "อยากไป";
  summary: string;
  description: string;
  highlights: string[];
  coverImage: string;
  gallery: string[];
};

export const places: Place[] = [
  {
    id: "khao-yai",
    name: "อุทยานแห่งชาติเขาใหญ่",
    category: "อุทยานแห่งชาติ",
    tags: ["ป่า", "น้ำตก", "ภูเขา", "แคมป์ปิง"],
    subdistrict: "หมูสี",
    district: "ปากช่อง",
    province: "นครราชสีมา",
    locationLabel: "ต.หมูสี อ.ปากช่อง จ.นครราชสีมา",
    latitude: 14.4381,
    longitude: 101.3728,
    visitedDate: "12–14 พ.ค. 2569",
    duration: "3 วัน 2 คืน",
    budget: "3,450 บาท",
    status: "ไปแล้ว",
    summary: "อากาศเย็น เส้นทางธรรมชาติสวย และมีจุดชมสัตว์หลายจุด",
    description: "บันทึกการเดินทางช่วงต้นฤดูฝน เดินเส้นทางศึกษาธรรมชาติ ชมน้ำตกเหวสุวัต และพักบริเวณใกล้อุทยาน เหมาะสำหรับย้อนดูเส้นทาง พิกัด และค่าใช้จ่ายของทริปครั้งนี้",
    highlights: ["น้ำตกเหวสุวัต", "ผาเดียวดาย", "จุดชมวิว กม.30"],
    coverImage: "/places/khao-yai.svg",
    gallery: ["/places/khao-yai.svg", "/places/waterfall.svg", "/places/mountain.svg"],
  },
  {
    id: "hat-chao-mai",
    name: "อุทยานแห่งชาติหาดเจ้าไหม",
    category: "ทะเลและชายหาด",
    tags: ["ทะเล", "ชายหาด", "เกาะ", "ดำน้ำ"],
    subdistrict: "ไม้ฝาด",
    district: "สิเกา",
    province: "ตรัง",
    locationLabel: "ต.ไม้ฝาด อ.สิเกา จ.ตรัง",
    latitude: 7.3724,
    longitude: 99.3482,
    visitedDate: "3–4 เม.ย. 2569",
    duration: "2 วัน 1 คืน",
    budget: "2,150 บาท",
    status: "ไปแล้ว",
    summary: "ชายหาดสงบ น้ำทะเลสวย เหมาะกับทริปสั้นและพักผ่อน",
    description: "เดินทางช่วงหน้าร้อน แวะชายหาดและจุดชมพระอาทิตย์ตก เก็บพิกัดสำหรับกลับมาเที่ยวซ้ำและใช้วางแผนเส้นทางครั้งต่อไป",
    highlights: ["หาดปากเมง", "เกาะมุก", "จุดชมพระอาทิตย์ตก"],
    coverImage: "/places/beach.svg",
    gallery: ["/places/beach.svg", "/places/island.svg", "/places/sunset.svg"],
  },
  {
    id: "doi-inthanon",
    name: "ดอยอินทนนท์",
    category: "ภูเขาและจุดชมวิว",
    tags: ["ภูเขา", "ทะเลหมอก", "น้ำตก", "อากาศหนาว"],
    subdistrict: "บ้านหลวง",
    district: "จอมทอง",
    province: "เชียงใหม่",
    locationLabel: "ต.บ้านหลวง อ.จอมทอง จ.เชียงใหม่",
    latitude: 18.5883,
    longitude: 98.4867,
    visitedDate: "20–22 ม.ค. 2569",
    duration: "3 วัน 2 คืน",
    budget: "4,200 บาท",
    status: "ไปแล้ว",
    summary: "จุดสูงสุดประเทศไทย อากาศหนาวและมีเส้นทางชมธรรมชาติ",
    description: "บันทึกทริปฤดูหนาว เน้นชมทะเลหมอกและเดินกิ่วแม่ปาน ข้อมูลพิกัดช่วยค้นหาเส้นทางและจุดแวะระหว่างทางย้อนหลังได้ง่าย",
    highlights: ["กิ่วแม่ปาน", "พระมหาธาตุ", "ยอดดอยอินทนนท์"],
    coverImage: "/places/mountain.svg",
    gallery: ["/places/mountain.svg", "/places/mist.svg", "/places/waterfall.svg"],
  },
  {
    id: "erawan",
    name: "น้ำตกเอราวัณ",
    category: "น้ำตก",
    tags: ["น้ำตก", "ธรรมชาติ", "เล่นน้ำ", "เดินป่า"],
    subdistrict: "ท่ากระดาน",
    district: "ศรีสวัสดิ์",
    province: "กาญจนบุรี",
    locationLabel: "ต.ท่ากระดาน อ.ศรีสวัสดิ์ จ.กาญจนบุรี",
    latitude: 14.3755,
    longitude: 99.1443,
    visitedDate: "ยังไม่กำหนด",
    duration: "ประมาณ 2 วัน 1 คืน",
    budget: "ประมาณ 3,000 บาท",
    status: "อยากไป",
    summary: "น้ำตก 7 ชั้น น้ำสีเขียวมรกต เหมาะกับการเดินทางช่วงธรรมชาติสมบูรณ์",
    description: "สถานที่ที่บันทึกไว้สำหรับวางแผนในอนาคต สามารถเปิดแผนที่ ดูพิกัด และนำข้อมูลไปสร้างแผนการเดินทางได้",
    highlights: ["น้ำตก 7 ชั้น", "เส้นทางเดินธรรมชาติ", "จุดเล่นน้ำ"],
    coverImage: "/places/waterfall.svg",
    gallery: ["/places/waterfall.svg", "/places/forest.svg", "/places/river.svg"],
  },
];

export function getPlace(id: string) {
  return places.find((place) => place.id === id);
}
