import { Metadata } from "next";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

const title = "Recruiting Dashboard | Yorby";
const description = "Find and hire the best candidates with AI-powered recruiting";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: `${defaultUrl}/api/og?title=${encodeURIComponent(title)}&type=recruiting`,
        width: 1200,
        height: 630,
        alt: "Yorby Recruiting Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${defaultUrl}/api/og?title=${encodeURIComponent(title)}&type=recruiting`],
  },
};

export default function RecruitingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}