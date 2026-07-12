export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: RBAC guard + nav goes here once auth wired
  return <>{children}</>;
}
