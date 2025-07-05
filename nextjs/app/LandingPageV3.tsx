import FAQ from "./components/FAQ";
import FeatureHighlightsV2 from "./components/FeatureHighlightsV2";

export default function LandingPageV3() {
  return (
    <div className="flex flex-col justify-center min-h-screen w-full mt-8 p-1">
      <FeatureHighlightsV2 />
      <FAQ />
    </div>
  );
}
