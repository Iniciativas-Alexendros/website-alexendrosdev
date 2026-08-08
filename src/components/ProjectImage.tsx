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

  const containerClassName =
    media.type === "gradient" ? (fallbackClassName ?? className) : undefined;
  const containerStyle: React.CSSProperties = {
    aspectRatio: "var(--media-project-ratio)",
    ...style,
    position: "relative",
  };

  return (
    <div
      className={containerClassName}
      style={containerStyle}
      aria-hidden={media.type === "gradient"}
    >
      {media.type === "image" ? (
        <Image
          className={className}
          src={media.src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <div className="ak-project-image-fallback" style={{ background: media.style }} />
      )}
    </div>
  );
}
