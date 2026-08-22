import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock the AuthContext used by ProtectedRoute
const authState: { user: null | { id: string }; loading: boolean } = {
  user: null,
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

import ProtectedRoute from "@/components/ProtectedRoute";

beforeEach(() => {
  authState.user = null;
  authState.loading = false;
});

describe("ProtectedRoute — smoke", () => {
  it("shows spinner while loading", () => {
    authState.loading = true;
    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to /auth", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>auth-page</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("auth-page")).toBeInTheDocument());
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    authState.user = { id: "u1" };
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});
