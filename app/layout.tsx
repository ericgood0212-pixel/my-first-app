import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "스킬투머니 - 배운 기술이 돈이 되는 원데이 클래스",
  description: "배운 기술이 돈이 되는 실전 원데이 클래스. 지금 예약하고 당신의 스킬을 수익화하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#060a17] text-slate-100 selection:bg-amber-400 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
