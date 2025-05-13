"use client";

import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ jobId }: { jobId: string }) => {
  const { baseUrl } = useMultiTenant();

  return (
    <Link
      href={`${baseUrl}/${jobId}`}
      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-8 w-8 mr-2" />
    </Link>
  );
};

export default BackButton;
