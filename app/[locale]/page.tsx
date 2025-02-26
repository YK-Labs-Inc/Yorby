import LandingPageV2 from "./LandingPageV2";
import LandingPageV3 from "./LandingPageV3";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const v3 = (await searchParams).v3 === "true";

  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      {v3 ? <LandingPageV3 /> : <LandingPageV2 />}
    </div>
  );
}
