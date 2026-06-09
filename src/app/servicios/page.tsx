import type { Metadata } from "next";
import { ServicesView } from "@/components/sections/services/ServicesView";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Servicios de seguridad, tooling/MCP y desarrollo fullstack. Planes por proyecto o retainer, precios cerrados y sin sorpresas.",
};

export default function ServicesPage() {
  return <ServicesView />;
}
