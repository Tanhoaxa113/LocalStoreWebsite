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

// SEO: Enhanced metadata with comprehensive Open Graph and Twitter cards
export const metadata: Metadata = {
  title: {
    default: "Mắt Kính Hàn Quốc Cần Thơ | Kính Mắt Hàn Quốc Cao Cấp",
    template: "%s | Mắt Kính Hàn Quốc Cần Thơ",
  },
  description: "Cửa hàng kính mắt Hàn Quốc chính hãng tại Cần Thơ. Khám phá bộ sưu tập kính thời trang, kính mát, gọng kính cao cấp với ưu đãi hấp dẫn.",
  keywords: ["kính Hàn Quốc", "kính mắt Cần Thơ", "kính mắt cao cấp", "kính thời trang", "kính mát Hàn Quốc", "gọng kính optical", "mua kính Hàn Quốc"],
  authors: [{ name: "Mắt Kính Hàn Quốc Cần Thơ" }],
  creator: "Mắt Kính Hàn Quốc Cần Thơ",
  publisher: "Mắt Kính Hàn Quốc Cần Thơ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Mắt Kính Hàn Quốc Cần Thơ - Kính Mắt Hàn Quốc Cao Cấp",
    description: "Cửa hàng kính mắt Hàn Quốc chính hãng tại Cần Thơ. Bộ sưu tập Tết 2026 với ưu đãi hấp dẫn.",
    type: "website",
    locale: "vi_VN",
    siteName: "Mắt Kính Hàn Quốc Cần Thơ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mắt Kính Hàn Quốc Cần Thơ",
    description: "Cửa hàng kính mắt Hàn Quốc chính hãng tại Cần Thơ",
  },
  alternates: {
    canonical: "/",
  },
  category: "E-commerce",
};

// SEO: JSON-LD structured data for Organization and WebSite
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "#organization",
      name: "Mắt Kính Hàn Quốc Cần Thơ",
      description: "Cửa hàng kính mắt Hàn Quốc chính hãng tại Cần Thơ",
      url: "/",
      telephone: "+84123456789",
      email: "chinguyen23724@gmail.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Cần Thơ",
        addressCountry: "VN",
      },
      sameAs: [
        "https://facebook.com",
        "https://instagram.com",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "#website",
      name: "Mắt Kính Hàn Quốc Cần Thơ",
      url: "/",
      publisher: { "@id": "#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: "/products?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light scroll-smooth">
      <head>
        {/* SEO: JSON-LD structured data for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
