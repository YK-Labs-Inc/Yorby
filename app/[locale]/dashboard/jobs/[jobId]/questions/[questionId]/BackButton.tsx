"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

const BackButton = ({ jobId }: { jobId: string }) => {
  const params = useParams();
  let baseUrl = "";
  if (params && "coachSlug" in params) {
    baseUrl = `/coaches/${params.coachSlug}/curriculum`;
  } else {
    baseUrl = `/dashboard/jobs`;
  }

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
