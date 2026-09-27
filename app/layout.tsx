import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={title:"もちと、まいにち",description:"小さなできたを、もちと一緒に。体重・気分・習慣のプライベートな記録。",icons:{icon:"/favicon.svg",apple:"/pets/mochi-icon.png"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"もちと、まいにち",statusBarStyle:"default"},robots:{index:false,follow:false}};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#fff8ee"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ja"><body>{children}</body></html>}
