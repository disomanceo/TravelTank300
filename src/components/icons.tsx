import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export function SearchIcon(p: IconProps){return <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>}
export function MapIcon(p: IconProps){return <svg {...base} {...p}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></svg>}
export function CalendarIcon(p: IconProps){return <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>}
export function BookIcon(p: IconProps){return <svg {...base} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5Z"/><path d="M4 6.5v13"/></svg>}
export function UserIcon(p: IconProps){return <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>}
export function PlusIcon(p: IconProps){return <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>}
export function PinIcon(p: IconProps){return <svg {...base} {...p}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>}
export function FilterIcon(p: IconProps){return <svg {...base} {...p}><path d="M4 5h16M7 12h10M10 19h4"/></svg>}
export function ClockIcon(p: IconProps){return <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
export function WalletIcon(p: IconProps){return <svg {...base} {...p}><path d="M3 6h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2Z"/><path d="M3 8V6a2 2 0 0 1 2-2h12"/><path d="M16 12h5"/></svg>}
export function MountainIcon(p: IconProps){return <svg {...base} {...p}><path d="m3 20 6-10 4 6 2-3 6 7Z"/><path d="m7.8 12 1.2 2 1.2-2"/></svg>}
export function BellIcon(p: IconProps){return <svg {...base} {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
export function ChevronRightIcon(p: IconProps){return <svg {...base} {...p}><path d="m9 18 6-6-6-6"/></svg>}
export function BackIcon(p: IconProps){return <svg {...base} {...p}><path d="m15 18-6-6 6-6"/></svg>}
export function ExternalLinkIcon(p: IconProps){return <svg {...base} {...p}><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>}
export function CameraIcon(p: IconProps){return <svg {...base} {...p}><path d="M14.5 5 13 3h-2L9.5 5H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Z"/><circle cx="12" cy="12.5" r="4"/></svg>}
export function ImageIcon(p: IconProps){return <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>}
export function CurrentLocationIcon(p: IconProps){return <svg {...base} {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>}
export function TrashIcon(p: IconProps){return <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>}
export function StarIcon(p: IconProps){return <svg {...base} {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>}
export function CheckIcon(p: IconProps){return <svg {...base} {...p}><path d="m5 12 4 4L19 6"/></svg>}
