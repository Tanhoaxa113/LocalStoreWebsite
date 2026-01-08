import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import StorySection from "@/components/home/StorySection";
import CoverflowGallery from "@/components/CoverflowGallery";

export const metadata: Metadata = {
  title: "Mắt Kính Hàn Quốc Cần Thơ | Bộ sưu tập Tết 2026",
  description: "Cửa hàng Kính Mắt Hàn Quốc chính hãng. Khám phá bộ sưu tập kính thời trang, gọng kính cận cao cấp với ưu đãi Tết 2026 hấp dẫn.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturedProducts />
      <StorySection />
      <CoverflowGallery />
    </div>
  );
}
