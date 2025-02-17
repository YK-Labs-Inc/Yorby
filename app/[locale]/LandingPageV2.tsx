import FeatureHighlight from "./components/FeatureHighlight";
import FAQ from "./components/FAQ";

export default function LandingPageV2() {
  return (
    <div className="flex flex-col justify-center min-h-screen w-full mt-8 p-4">
      <FeatureHighlight />
      <FAQ />
    </div>
  );
}
