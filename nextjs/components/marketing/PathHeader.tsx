import { Button } from "../ui/button";
import Link from "next/link";

export function PathHeader() {
  return (
    <div className="w-full border-b h-16 bg-background z-50">
      <div className="h-full max-w-screen-xl mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img
            src="/assets/dark-logo.png"
            alt="Perfect Interview"
            className="w-8 h-8 mr-2"
          />
          <span className="font-semibold text-xl">Perfect Interview</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="default">Try Perfect Interview</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
