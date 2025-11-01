import HeroSectionOne from "@/components/hero-section-demo-1";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { SparklesCore } from "@/components/ui/sparkles";
import { Sparkle, Sparkles } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {<HeroSectionOne />}
    </div>
  );
}
