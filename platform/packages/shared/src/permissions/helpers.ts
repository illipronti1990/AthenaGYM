export function hasPermission(
  permissions: string[] | undefined | null,
  required: string | string[],
): boolean {
  if (!permissions?.length) return false;
  const set = new Set(permissions);
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => set.has(p));
}

export function hasAnyPermission(
  permissions: string[] | undefined | null,
  required: string[],
): boolean {
  if (!permissions?.length) return false;
  const set = new Set(permissions);
  return required.some((p) => set.has(p));
}

export function hasRole(
  roles: string[] | undefined | null,
  required: string | string[],
): boolean {
  if (!roles?.length) return false;
  const set = new Set(roles);
  const list = Array.isArray(required) ? required : [required];
  return list.some((r) => set.has(r));
}

export function canAccessUnit(
  unitIds: string[] | undefined | null,
  unitId: string | null | undefined,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  if (!unitId) return true;
  if (!unitIds?.length) return true;
  return unitIds.includes(unitId);
}
