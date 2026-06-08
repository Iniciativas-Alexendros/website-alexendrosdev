import type { Metadata } from "next";
import { EscaparateView } from "@/components/sections/escaparate/EscaparateView";

export const metadata: Metadata = {
  title: "Escaparate",
  description:
    "Proyectos destacados y servicios listos para contratar. El escaparate de Alejandro Domingo Agustí (Alexendros): trabajo seleccionado y compra directa con Stripe.",
};

export default function EscaparatePage() {
  return <EscaparateView />;
}
