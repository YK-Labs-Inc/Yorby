import { H3 } from "../typography";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import Link from "next/link";

const Header = () => {
  const { baseUrl, isCoachPath } = useMultiTenant();

  return (
    <Link href={baseUrl} className="flex items-center">
      {isCoachPath ? (
        <H3>Yorby</H3>
      ) : (
        <>
          <img
            src="/assets/dark-logo.png"
            alt="Perfect Interview"
            className="w-8 h-8 mr-2"
          />
          <H3>{"Perfect Interview"}</H3>
        </>
      )}
    </Link>
  );
};

export default Header;
