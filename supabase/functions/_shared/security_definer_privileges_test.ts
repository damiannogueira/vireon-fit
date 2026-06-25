// Automated RLS / privilege tests for SECURITY DEFINER functions in public schema.
//
// Verifies that each SECURITY DEFINER function has EXACTLY the EXECUTE grants
// expected by the security model. Any drift (e.g. a future migration that
// accidentally grants EXECUTE to anon/authenticated on an internal helper)
// makes the test fail.
//
// Run with:
//   supabase functions test --pattern "SECURITY DEFINER privileges"
// or via the supabase--test_edge_functions tool.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Expectation = {
  anon: boolean;
  authenticated: boolean;
  service_role: boolean;
};

// Expected EXECUTE privileges per role. Keep in sync with the migrations that
// revoke privileges from PUBLIC / anon / authenticated.
//
// Rationale:
// - is_super_admin / cancel_own_subscription: callable by signed-in users
//   (used by RLS policies and the "cancel my subscription" UI respectively).
// - All other helpers are invoked from SECURITY DEFINER functions, triggers
//   or event triggers and must NOT be reachable from the Data API.
const EXPECTED: Record<string, Expectation> = {
  cancel_own_subscription:       { anon: false, authenticated: true,  service_role: true },
  is_super_admin:                { anon: false, authenticated: true,  service_role: true },

  check_and_award_achievements:  { anon: false, authenticated: false, service_role: true },
  create_user_subscription:      { anon: false, authenticated: false, service_role: true },
  create_welcome_notification:   { anon: false, authenticated: false, service_role: true },
  get_gym_member_stats:          { anon: false, authenticated: false, service_role: true },
  get_profile_id_from_auth:      { anon: false, authenticated: false, service_role: true },
  get_user_gym_id:               { anon: false, authenticated: false, service_role: true },
  handle_new_user:               { anon: false, authenticated: false, service_role: true },
  has_role:                      { anon: false, authenticated: false, service_role: true },
  is_gym_admin:                  { anon: false, authenticated: false, service_role: true },
  is_member_of_gym:              { anon: false, authenticated: false, service_role: true },
  link_user_to_gym:              { anon: false, authenticated: false, service_role: true },
  rls_auto_enable:               { anon: false, authenticated: false, service_role: true },
  search_unlinked_profiles:      { anon: false, authenticated: false, service_role: true },
  update_streak_on_workout:      { anon: false, authenticated: false, service_role: true },
};

function env(name: string): string | null {
  try { return Deno.env.get(name) ?? null; } catch { return null; }
}

function requireEnv(): { url: string; service: string; anon: string } | null {
  const url = env("SUPABASE_URL");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  const anon = env("SUPABASE_ANON_KEY");
  if (!url || !service || !anon) {
    console.warn(
      "[security_definer_privileges_test] Skipping: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY not set in this test environment.",
    );
    return null;
  }
  return { url, service, anon };
}

Deno.test("SECURITY DEFINER privileges match the expected matrix", async () => {
  const cfg = requireEnv();
  if (!cfg) return;
  const admin = createClient(cfg.url, cfg.service, { auth: { persistSession: false } });

  const { data, error } = await admin
    .from("security_definer_privileges")
    .select("proname, anon_exec, auth_exec, svc_exec");

  if (error) {
    throw new Error(
      `Could not read security_definer_privileges view (${error.message}). ` +
      `Make sure the migration that creates it has been applied.`,
    );
  }

  const actual = new Map<string, Expectation>();
  for (const row of data ?? []) {
    actual.set(row.proname as string, {
      anon: row.anon_exec as boolean,
      authenticated: row.auth_exec as boolean,
      service_role: row.svc_exec as boolean,
    });
  }

  // 1. Every expected function still exists with the right grants.
  for (const [name, expected] of Object.entries(EXPECTED)) {
    const got = actual.get(name);
    if (!got) {
      throw new Error(`Expected SECURITY DEFINER function public.${name} is missing`);
    }
    assertEquals(
      got,
      expected,
      `Privilege drift on public.${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`,
    );
  }

  // 2. No NEW SECURITY DEFINER function silently appears without explicit
  //    expectations — that would be a security review gap.
  const unexpected = [...actual.keys()].filter((n) => !(n in EXPECTED));
  assertEquals(
    unexpected,
    [],
    `New SECURITY DEFINER functions detected without an entry in EXPECTED: ${unexpected.join(", ")}. ` +
    `Add them to the matrix after reviewing their intended callers.`,
  );
});

Deno.test("anon client cannot execute internal SECURITY DEFINER helpers", async () => {
  const cfg = requireEnv();
  if (!cfg) return;
  const anon = createClient(cfg.url, cfg.anon, { auth: { persistSession: false } });

  // Sample a few internal helpers — RPC must fail for the anon role.
  const samples = ["has_role", "is_gym_admin", "get_user_gym_id", "link_user_to_gym"];
  for (const fn of samples) {
    const { error } = await anon.rpc(fn as never, {} as never);
    if (!error) {
      throw new Error(`anon was able to call public.${fn} — EXECUTE should be revoked`);
    }
    // PostgREST returns 404 (function not found in schema cache for this role)
    // or 42501 permission denied. Either is acceptable evidence of lockdown.
  }
});
