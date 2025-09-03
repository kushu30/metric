// This layout now ONLY handles the logic for its children, not the UI.
// The root layout handles the Header.
export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}