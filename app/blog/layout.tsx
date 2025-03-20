import { Geist } from "next/font/google";
import "../[locale]/globals.css";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.className}>
      <body>{children}</body>
    </html>
  );
}
