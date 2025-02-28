import LandingPageV3 from "./LandingPageV3";

export const maxDuration = 300;

export default async function Home() {
  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      <LandingPageV3 />
    </div>
  );
}
