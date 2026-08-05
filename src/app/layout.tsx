import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
export const metadata:Metadata={title:{default:"Travel Tank300",template:"%s | Travel Tank300"},description:"บันทึกการท่องเที่ยวสายออฟโรด By Tank300",manifest:"/manifest.webmanifest",applicationName:"Travel Tank300",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Travel Tank300"},icons:{icon:[{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icons/icon-512.png",sizes:"512x512",type:"image/png"}],apple:[{url:"/icons/icon-180.png",sizes:"180x180",type:"image/png"}]},formatDetection:{telephone:false}};
export const viewport:Viewport={themeColor:"#075749",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body><PwaRegister/>{children}<BottomNav/></body></html>}
