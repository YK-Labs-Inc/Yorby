import React from "react";

interface CoachPortalLandingPageProps {
  params: Promise<{
    coachName: string;
    locale: string;
  }>;
}

export default async function CoachPortalLandingPage({
  params,
}: CoachPortalLandingPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Coach Portal Landing Page</h1>
      <p>
        Purpose: Displays coach&apos;s branding and lists their available
        curricula.
      </p>
      <p>Coach Name: {resolvedParams.coachName}</p>
    </div>
  );
}
