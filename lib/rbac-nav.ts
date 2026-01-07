export type UserRole = "admin" | "manager" | "accounts" | "staff" | "pos_operator";

export type NavItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["admin","manager","accounts","staff","pos_operator"] },
  { label: "Orders", href: "/sales/orders", roles: ["admin","manager","staff"] },
  { label: "Customers", href: "/customers", roles: ["admin","manager","staff","pos_operator"] },
  { label: "Job Cards", href: "/production/job-cards", roles: ["admin","manager","staff"] },
  { label: "Production", href: "/production/board", roles: ["admin","manager","staff"] },
  { label: "Inventory", href: "/inventory", roles: ["admin","manager"] },
  { label: "POS", href: "/pos", roles: ["admin","manager","pos_operator"] },
  { label: "Reports", href: "/reports", roles: ["admin","manager","accounts"] },
  { label: "Settings", href: "/settings", roles: ["admin"] },
];

