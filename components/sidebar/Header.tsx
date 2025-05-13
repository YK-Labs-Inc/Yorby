import { Link } from "@/i18n/routing";
import { H3 } from "../typography";
import { useMultiTenant } from "@/app/context/MultiTenantContext";

const Header = () => {
  const { baseUrl, coachBrandingSettings } = useMultiTenant();

  return (
    <Link href={baseUrl} className="flex items-center">
      {coachBrandingSettings ? (
        <H3>{coachBrandingSettings.title}</H3>
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
