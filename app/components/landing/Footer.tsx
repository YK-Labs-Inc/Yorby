import { Link } from "@/i18n/routing";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center border-t mx-auto text-center text-xs gap-4 py-16">
      <div className="flex items-center gap-8">
        <p>© 2025 YK Labs. All rights reserved.</p>
      </div>
      <div className="flex items-center gap-4 text-gray-600">
        <Link href={`/privacy-policy`} className="hover:text-gray-900">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href={`/terms-of-service`} className="hover:text-gray-900">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
