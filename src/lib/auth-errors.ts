/**
 * Sanitize Supabase auth errors to prevent information leakage.
 * Maps specific error codes/messages to generic user-facing messages.
 */
export function sanitizeAuthError(error: { message?: string; code?: string; status?: number }): string {
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';

  // Login failures — use same message for "user not found" and "wrong password"
  if (
    code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid password') ||
    msg.includes('user not found')
  ) {
    return 'Credenciales incorrectas. Verifica tu email y contraseña.';
  }

  if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Por favor confirma tu email antes de iniciar sesión.';
  }

  if (msg.includes('rate limit') || msg.includes('too many requests') || error.status === 429) {
    return 'Demasiados intentos. Por favor, espera unos minutos.';
  }

  if (msg.includes('weak password') || msg.includes('password') && msg.includes('characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'Este email ya está registrado. Intenta iniciar sesión.';
  }

  // Generic fallback — never expose raw error details
  return 'Error al procesar tu solicitud. Inténtalo de nuevo.';
}
