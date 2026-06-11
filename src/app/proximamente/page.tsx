import type { Metadata } from "next";
import { ComingSoon } from "@/components/sections/coming-soon/ComingSoon";

export const metadata: Metadata = {
  title: "En construcción",
  description: "El nuevo portfolio de Alejandro Vargas — publicación en breve.",
};

export default function ProximamentePage() {
  return <ComingSoon />;
}
