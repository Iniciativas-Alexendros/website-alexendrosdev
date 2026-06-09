import type { Metadata } from "next";
import { ProjectsView } from "@/components/sections/projects/ProjectsView";

export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Herramientas de seguridad, gateways de credenciales, tooling para desarrolladores y proyectos open source.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
