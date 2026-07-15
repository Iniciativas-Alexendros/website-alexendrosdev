import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "../helpers/render";
import { Terminal } from "@/components/sections/Terminal";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Terminal", () => {
  it("muestra el contenido completo al instante con prefers-reduced-motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);

    const { container } = render(<Terminal />);
    act(() => {});
    expect(container.textContent).toContain("alexendros");
    expect(container.textContent).toContain("developer");
  });

  it("teclea el comando y revela las líneas con el tiempo (sin reduced-motion)", () => {
    vi.useFakeTimers();
    const { container } = render(<Terminal />);
    for (let i = 0; i < 100; i++) {
      act(() => {
        vi.advanceTimersByTime(60);
      });
    }
    expect(container.textContent).toContain("alexendros");
    expect(container.textContent).toContain("developer");
  });
});
