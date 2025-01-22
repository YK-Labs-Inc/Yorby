import LandingPageV2 from "./LandingPageV2";

export default async function Home() {
  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      <LandingPageV2 />
    </div>
  );
}
