"use client";

import Image from "next/image";

import { getProjectImageOrGradient } from "@/lib/project-images";

interface ProjectImageProps {
  id: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
}

/**
 * Renderiza la imagen de un proyecto: captura real si existe,
 * o gradiente CSS OKLCH con los tokens del design system.
 */
export function ProjectImage({
  id,
  alt,
  className = "",
  fallbackClassName,
  style,
  priority = false,
  sizes = "100vw",
}: ProjectImageProps) {
  const media = getProjectImageOrGradient(id);

  if (media.type === "image") {
    return (
      <Image
        src={media.src}
        alt={alt}
        className={className}
        fill
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div
      className={fallbackClassName ?? className}
      style={{ background: media.style, minHeight: 300, ...style }}
      aria-hidden="true"
    />
  );
}
