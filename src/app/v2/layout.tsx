import { HeaderV2 } from "@/components/layout/v2/HeaderV2";
import { FooterV2 } from "@/components/layout/v2/FooterV2";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderV2 />
      <main>{children}</main>
      <FooterV2 />
    </>
  );
}
