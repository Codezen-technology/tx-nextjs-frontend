/**
 * Passthrough — each shop sub-route picks its own chrome:
 *  - product, order-confirmation → full SiteShell
 *  - cart, checkout → logo-only MinimalShell
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
