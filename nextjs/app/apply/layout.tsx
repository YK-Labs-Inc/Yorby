import Image from "next/image";
import Link from "next/link";

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}

      {/* Powered by Yorby Badge */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="https://yorby.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 bg-gradient-to-r from-primary/95 to-primary backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:from-primary hover:to-primary/90"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary-foreground font-semibold">
              Powered by Yorby
            </span>
            <Image
              src="/assets/light-logo.png"
              alt="Yorby"
              width={75}
              height={20}
              className="h-5 w-auto brightness-0 invert group-hover:scale-105 transition-all duration-300"
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </div>
  );
}
