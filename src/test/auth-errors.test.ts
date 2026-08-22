import { describe, it, expect } from "vitest";
import { sanitizeAuthError } from "@/lib/auth-errors";

describe("sanitizeAuthError", () => {
  it("collapses invalid credentials to a generic message", () => {
    expect(sanitizeAuthError({ code: "invalid_credentials" })).toMatch(/Credenciales/i);
    expect(sanitizeAuthError({ message: "Invalid login credentials" })).toMatch(/Credenciales/i);
    expect(sanitizeAuthError({ message: "User not found" })).toMatch(/Credenciales/i);
  });

  it("maps email-not-confirmed", () => {
    expect(sanitizeAuthError({ code: "email_not_confirmed" })).toMatch(/confirma tu email/i);
  });

  it("maps rate-limit (429)", () => {
    expect(sanitizeAuthError({ status: 429, message: "rate limit" })).toMatch(/Demasiados intentos/i);
  });

  it("maps already-registered", () => {
    expect(sanitizeAuthError({ message: "User already registered" })).toMatch(/ya está registrado/i);
  });

  it("never leaks raw error details for unknown errors", () => {
    const out = sanitizeAuthError({ message: "DB connection string leaked at 10.0.0.1:5432" });
    expect(out).not.toMatch(/10\.0\.0\.1/);
    expect(out).toMatch(/Inténtalo de nuevo/i);
  });
});
