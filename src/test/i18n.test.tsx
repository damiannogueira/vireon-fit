import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/i18n";
import type { ReactNode } from "react";
import { localizedField, translateDbLabel } from "@/i18n/dbLabels";

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("I18nProvider — formatPrice & currency", () => {
  it("returns FREE label when both prices are 0", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.formatPrice(0, 0)).toMatch(/free|gratis/i);
  });

  it("formats USD by default", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.formatPrice(9.99, 8.99)).toBe("$9.99");
  });

  it("formats EUR when currency switched", () => {
    localStorage.setItem("vireon-currency", "EUR");
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.formatPrice(9.99, 8.99)).toBe("€8.99");
  });
});

describe("database content localization", () => {
  it("prefers persisted English variants", () => {
    expect(localizedField({ name: "Día 2: Tren Inferior", name_en: "Day 2: Lower Body" }, "name", "en"))
      .toBe("Day 2: Lower Body");
  });

  it("keeps Spanish variants in Spanish", () => {
    expect(localizedField({ description: "Entrenamiento integral", description_en: "Well-rounded training" }, "description", "es"))
      .toBe("Entrenamiento integral");
  });

  it("localizes historical weekly adjustment and progression messages", () => {
    expect(translateDbLabel("Semana tranquila (1/3). Ajustamos para que sea más manejable 🎯", "en"))
      .toBe("A lighter week (1/3). We're adjusting the load to make it more manageable 🎯");
    expect(translateDbLabel("Mismo peso, +1 rep por serie ⬆️", "en"))
      .toBe("Same weight, +1 rep per set ⬆️");
  });
});
