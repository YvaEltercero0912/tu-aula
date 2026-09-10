export function hasRole(
  role: string,
  allowedRoles: string[]
) {
  return allowedRoles.includes(role);
}
