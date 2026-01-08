import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import TetEffects from "@/components/effects/TetEffects";
import ScrollBackground from "@/components/effects/ScrollBackground";
import LayoutWrapper from "@/components/LayoutWrapper";

// Fonts with full Vietnamese Unicode support
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mắt Kính Hàn Quốc Cần Thơ | Kính Mắt Hàn Quốc Cao Cấp",
  description: "Khám phá bộ sưu tập kính mắt Hàn Quốc cao cấp với phong cách thanh lịch. Kính thời trang, kính mát, gọng kính chính hãng.",
  keywords: ["kính Hàn Quốc", "kính mắt cao cấp", "kính thời trang", "kính mát", "gọng kính optical"],
  openGraph: {
    title: "Mắt Kính Hàn Quốc Cần Thơ - Kính Mắt Hàn Quốc",
    description: "Bộ sưu tập kính mắt Hàn Quốc cao cấp - Tết 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body
        className={`${inter.variable} ${beVietnamPro.variable} font-sans antialiased`}
      >
        <ScrollBackground />
        <TetEffects />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
