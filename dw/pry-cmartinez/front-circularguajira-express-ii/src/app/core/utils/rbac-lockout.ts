/**
 * RBAC administration endpoints. Revoking one of them from a role the session holds would lock
 * the administrator out of the screens that give access back, so the UI never lets that happen
 * (the backend keeps being the authority: this protects against a mis-click, not an attacker).
 */
const RBAC_ADMIN_PATH = /^\/api\/(users|roles|resources|role-users|resource-roles)(\/|$)/;

export function isRbacAdminPath(path: string | undefined | null): boolean {
  return RBAC_ADMIN_PATH.test(path ?? '');
}
