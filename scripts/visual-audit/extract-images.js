(() => {
  const abs = (u) => {
    try {
      return new URL(u, location.href).href;
    } catch {
      return u || null;
    }
  };
  const nearbyText = (el, max = 280) => {
    const root = el.closest("section, article, li, figure, a, div") || el.parentElement;
    const t = (root?.innerText || "").replace(/\s+/g, " ").trim();
    return t.slice(0, max);
  };
  const nodes = [
    ...document.querySelectorAll("img"),
    // Skip <source> elements entirely — <img> inside <picture> already captures the render
    ...document.querySelectorAll('[style*="background-image"]'),
    ...document.querySelectorAll("video[poster]"),
    ...document.querySelectorAll("image, svg image"),
  ];
  const out = [];
  let i = 0;
  for (const el of nodes) {
    const tag = el.tagName.toLowerCase();
    let src = null;
    let srcset = null;
    let alt = null;
    let role = el.getAttribute("role");
    let ariaHidden = el.getAttribute("aria-hidden");
    if (tag === "img") {
      src = el.currentSrc || el.src || el.getAttribute("src");
      srcset = el.srcset || null;
      alt = el.alt ?? null;
    } else if (tag === "source") {
      srcset = el.srcset || null;
      src = el.getAttribute("src");
    } else if (tag === "video") {
      src = el.getAttribute("poster");
      alt = "[video poster]";
    } else if (
      el.hasAttribute("style") &&
      /background-image/i.test(el.getAttribute("style") || "")
    ) {
      const m = (el.getAttribute("style") || "").match(/url\(["']?([^"')]+)["']?\)/i);
      src = m ? m[1] : null;
      alt = "[css background]";
    } else {
      src = el.getAttribute("href") || el.getAttribute("xlink:href");
      alt = "[svg image]";
    }
    const rect = el.getBoundingClientRect?.() || { width: 0, height: 0, top: 0, left: 0 };
    const cs = el instanceof Element ? getComputedStyle(el) : null;
    out.push({
      id: `img-${++i}`,
      page: location.pathname,
      tag,
      src: abs(src),
      srcset,
      alt,
      role,
      ariaHidden,
      loading: el.getAttribute?.("loading"),
      widthAttr: el.getAttribute?.("width"),
      heightAttr: el.getAttribute?.("height"),
      naturalWidth: el.naturalWidth || null,
      naturalHeight: el.naturalHeight || null,
      box: {
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        top: Math.round(rect.top + scrollY),
        left: Math.round(rect.left + scrollX),
      },
      visible: !!(
        cs &&
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      ),
      opacity: cs ? cs.opacity : null,
      nearbyText: nearbyText(el),
      nextImage: !!(src && String(src).includes("/_next/image")),
    });
  }
  return {
    url: location.href,
    title: document.title,
    count: out.length,
    images: out,
  };
})();
