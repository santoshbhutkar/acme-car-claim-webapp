import { AdjusterHeader } from "@/components/site-chrome";

export default function AdjusterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdjusterHeader />
      <main>{children}</main>
    </>
  );
}
