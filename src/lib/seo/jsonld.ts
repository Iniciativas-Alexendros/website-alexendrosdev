/**
 * Helpers para generar objetos JSON-LD Schema.org tipados con schema-dts.
 * La salida es un plain object serializable por JSON.stringify.
 * No incluir email del operador en ningún JSON-LD público.
 */
import type {
  WebSite,
  Person,
  WithContext,
  BreadcrumbList,
  BlogPosting,
  SoftwareApplication,
  ProfessionalService,
  SearchAction,
} from "schema-dts";
import type { Post, Project } from "@/lib/content/types";

const SITE_URL = "https://alexendros.dev";
const SITE_NAME = "Alejandro Domingo Agustí";

export function makeWebSiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Desarrollo plataformas, webs y aplicaciones a medida en Valencia. Tecnología moderna, código que es tuyo.",
    inLanguage: "es-ES",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as unknown as SearchAction,
  };
}

export function makePersonJsonLd(): WithContext<Person> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "Desarrollador de plataformas, webs y aplicaciones",
    worksFor: {
      "@type": "Organization",
      name: "Alexendros",
      url: SITE_URL,
    },
    sameAs: [
      "https://github.com/Alexendros",
      "https://www.linkedin.com/in/alejandro-d-a-024391384",
    ],
  };
}

export function makeProfessionalServiceJsonLd(): WithContext<ProfessionalService> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: `${SITE_URL}/servicios`,
    description:
      "Desarrollo de webs, aplicaciones y plataformas a medida en Valencia. Planes por proyecto o cuota mensual, precios cerrados pensados para empresas nuevas y pequeñas.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Valencia",
      addressCountry: "ES",
    },
  };
}

export function makeBlogPostingJsonLd(post: Post): WithContext<BlogPosting> {
  const description =
    post.metaDescription ?? post.desc ?? `${post.title} — nota de ingeniería.`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    url: `${SITE_URL}/blog/${post.id}`,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: "es-ES",
    keywords: post.tag,
  };
}

export function makeCreativeWorkJsonLd(
  project: Project
): WithContext<SoftwareApplication> {
  const description = project.metaDescription ?? project.desc;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description,
    url: project.liveUrl ?? `${SITE_URL}/proyectos/${project.id}`,
    applicationCategory: project.category,
    author: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    keywords: project.tags.join(", "),
    datePublished: project.year,
    ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
  };
}

export function makeBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
