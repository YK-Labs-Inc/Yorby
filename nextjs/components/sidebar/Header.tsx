import { H3 } from "../typography";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import Link from "next/link";

const Header = () => {
  const { baseUrl, isYorbyCoaching } = useMultiTenant();

  return (
    <Link href={baseUrl} className="flex items-center">
      {isYorbyCoaching ? <H3>Yorby</H3> : <H3>{"Yorby"}</H3>}
    </Link>
  );
};

export default Header;
