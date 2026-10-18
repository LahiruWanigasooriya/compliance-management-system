// hooks/useSidebarLinks.ts

import { useAuth } from "@/components/providers/auth.provider";
import { SIDEBAR_LINKS, SIDEBAR_RESOURCE_MAP } from "@/constants/constants";

const hasPrivilege = (
  privileges: any[],
  resource: string,
  action: string = "get",
): boolean => {
  if (!privileges || !resource) return false;
  const priv = privileges.find((p: any) => p.resource === resource);
  if (!priv) return false;
  if (Array.isArray(priv.actions)) {
    return priv.actions.some((a: any) => a?.[action] === true || (a?.[action] !== false && action === "get"));
  }
  if (typeof priv.actions === "object" && priv.actions !== null) {
    return priv.actions[action] === true || (priv.actions[action] !== false && action === "get");
  }
  return false;
};

export const useSidebarLinks = () => {
  const { user } = useAuth();
  const privileges = user?.privileges;

  // If privileges are not explicitly defined/empty (e.g. admin or dev mode), show all sidebar links
  if (!privileges || privileges.length === 0) {
    return SIDEBAR_LINKS;
  }

  const filteredLinks = SIDEBAR_LINKS.map((link) => {
    const requiredResource = SIDEBAR_RESOURCE_MAP[link.id];

    if (!requiredResource) {
      return link;
    }

    const canAccess = hasPrivilege(privileges, requiredResource, "get");

    if (!canAccess) {
      return null;
    }

    return link;
  }).filter(Boolean);

  return filteredLinks;
};
