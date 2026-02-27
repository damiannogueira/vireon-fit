import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { es } from "./locales/es";
import { en } from "./locales/en";

type Locale = "es" | "en";
type Currency = "USD" | "EUR";
type Translations = typeof es;

interface I18nContextType {
  locale: Locale;
  currency: Currency;
  t: Translations;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceUsd: number, priceEur: number) => string;
}

const locales: Record<Locale, Translations> = { es, en };

const I18nContext = createContext<I18nContextType | null>(null);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

const getInitialLocale = (): Locale => {
  const saved = localStorage.getItem("vireon-locale");
  if (saved === "es" || saved === "en") return saved;
  const browserLang = navigator.language.slice(0, 2);
  return browserLang === "es" ? "es" : "en";
};

const getInitialCurrency = (): Currency => {
  const saved = localStorage.getItem("vireon-currency");
  if (saved === "USD" || saved === "EUR") return saved;
  return "USD";
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("vireon-locale", l);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("vireon-currency", c);
  }, []);

  const formatPrice = useCallback((priceUsd: number, priceEur: number) => {
    if (priceUsd === 0 && priceEur === 0) return locales[locale].common.free;
    const value = currency === "USD" ? priceUsd : priceEur;
    const symbol = currency === "USD" ? "$" : "€";
    return `${symbol}${value.toFixed(2)}`;
  }, [locale, currency]);

  return (
    <I18nContext.Provider value={{ locale, currency, t: locales[locale], setLocale, setCurrency, formatPrice }}>
      {children}
    </I18nContext.Provider>
  );
};
