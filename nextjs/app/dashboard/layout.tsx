import { Metadata } from "next";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

const title = "Yorby";
const description = "Ace your next interview with AI-powered interview prep";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: `${defaultUrl}/assets/b2c-ograph.png`,
        width: 1200,
        height: 630,
        alt: "Perfect Interview Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      `${defaultUrl}/assets/b2c-ograph.png`,
    ],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
