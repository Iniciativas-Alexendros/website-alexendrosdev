import type { Metadata } from "next";
import { ServicesView } from "@/components/sections/services/ServicesView";
import { JsonLd } from "@/components/JsonLd";
import { makeProfessionalServiceJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Desarrollo de webs, aplicaciones y plataformas a medida. Planes por proyecto o cuota mensual, precios cerrados y contenidos para empresas nuevas y pequeñas.",
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={makeProfessionalServiceJsonLd()} />
      <ServicesView />
    </>
  );
}
