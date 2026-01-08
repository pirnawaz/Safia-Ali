export type UserRole = "admin" | "manager" | "accounts" | "staff" | "pos_operator";

export type NavItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["admin","manager","accounts","staff","pos_operator"] },
  { label: "Products", href: "/designs", roles: ["admin","manager","accounts","staff"] },
  { label: "Sales Orders", href: "/sales/orders", roles: ["admin","manager","staff"] },
  { label: "Customers", href: "/customers", roles: ["admin","manager","staff","pos_operator"] },
  { label: "Production Board", href: "/production/board", roles: ["admin","manager","staff"] },
  { label: "Job Cards", href: "/production/job-cards", roles: ["admin","manager","staff"] },
  { label: "Alterations", href: "/production/alterations", roles: ["admin","manager","staff"] },
  { label: "Inventory", href: "/inventory", roles: ["admin","manager"] },
  { label: "POS", href: "/pos", roles: ["admin","manager","pos_operator"] },
  { label: "Accounting", href: "/accounting", roles: ["admin","manager","accounts"] },
  { label: "Reports", href: "/reports", roles: ["admin","manager","accounts"] },
  { label: "Roadmap", href: "/roadmap", roles: ["admin","manager","accounts","staff"] },
  { label: "Settings", href: "/settings", roles: ["admin"] },
];

