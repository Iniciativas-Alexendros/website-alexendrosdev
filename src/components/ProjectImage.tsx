"use client";

import { getProjectImageOrGradient } from "@/lib/project-images";

interface ProjectImageProps {
  id: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Renderiza la imagen de un proyecto: captura real si existe,
 * o gradiente CSS OKLCH con los tokens del design system.
 */
export function ProjectImage({ id, alt, className = "", priority = false }: ProjectImageProps) {
  const media = getProjectImageOrGradient(id);

  if (media.type === "image") {
    return (
      <img
        src={media.src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ background: media.style, minHeight: 300 }}
      aria-hidden="true"
    />
  );
}
