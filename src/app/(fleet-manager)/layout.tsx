export default function FleetManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: RBAC guard + nav goes here once auth wired
  return <>{children}</>;
}
