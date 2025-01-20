import LandingPageV2 from "./LandingPageV2";
import WaitlistComponent from "./WaitlistComponent";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const isDev = (await searchParams).dev === "true";
  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      {isDev ? <LandingPageV2 /> : <WaitlistComponent />}
    </div>
  );
}
