import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider, useI18n } from "@/i18n";
import NotFound from "@/pages/NotFound";

function LocaleSwitcher({ to }: { to: "es" | "en" }) {
  const { setLocale } = useI18n();
  return <button onClick={() => setLocale(to)}>switch-{to}</button>;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("vireon-locale", "es");
});

describe("NotFound — i18n smoke", () => {
  it("renders Spanish copy when locale=es", () => {
    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <I18nProvider>
          <NotFound />
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Página no encontrada")).toBeInTheDocument();
    expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
  });

  it("switches to English when locale toggles", () => {
    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <I18nProvider>
          <LocaleSwitcher to="en" />
          <NotFound />
        </I18nProvider>
      </MemoryRouter>
    );
    act(() => {
      screen.getByText("switch-en").click();
    });
    // English fallback strings come from en locale
    expect(screen.queryByText("Página no encontrada")).not.toBeInTheDocument();
  });
});
