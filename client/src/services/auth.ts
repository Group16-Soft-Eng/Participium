// Minimal auth helpers for dev: login stores token and role in localStorage
export type Role = 'citizen' | 'employee' | null;

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setRole(role: Role) {
  if (role) localStorage.setItem('role', role);
  else localStorage.removeItem('role');
}

export function getRole(): Role {
  return (localStorage.getItem('role') as Role) || null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  // notify listeners; navigation handled by caller if desired
  window.dispatchEvent(new Event('authChange'));
}

// Try to decode a JWT and extract the payload. Returns null if not a JWT or invalid.
export function decodeJwt(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // atob with URL-safe base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function getRoleFromToken(token: string | null): Role {
  const data = decodeJwt(token);
  if (!data) return null;
  
  // Check 'type' field first (our backend uses this)
  if (data.type) {
    // If type is 'user', return 'citizen'
    if (data.type === 'user') return 'citizen';
    // If type is any officer role (TECHNICAL_OFFICE_STAFF, etc.), return 'employee'
    if (data.type !== 'user') return 'employee';
  }
  
  // Fallback to common claim names: role, roles, scope
  if (data.role) return data.role as Role;
  if (data.roles && Array.isArray(data.roles) && data.roles.length > 0) return (data.roles[0] as Role);
  if (typeof data.scope === 'string' && data.scope.includes('employee')) return 'employee';
  return null;
}

export interface DecodedUser {
  username?: string;
  sub?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
}

export function getUserFromToken(token: string | null): DecodedUser | null {
  const data = decodeJwt(token);
  if (!data) return null;
  const user: DecodedUser = {};
  if (data.username) user.username = data.username;
  if (data.sub) user.sub = data.sub;
  if (data.given_name) user.given_name = data.given_name;
  if (data.family_name) user.family_name = data.family_name;
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  return user;
}
