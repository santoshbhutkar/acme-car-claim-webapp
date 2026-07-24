import { ClaimantHeader } from "@/components/site-chrome";

export default function ClaimantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClaimantHeader />
      <main>{children}</main>
    </>
  );
}
