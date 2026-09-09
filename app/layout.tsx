import type { Metadata } from "next";
import { KicklaceTag } from "kicklace/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kicklace starter",
  description:
    "A Next.js app wired to Kicklace: the tag on the site, the package in a sign-up handler and a Stripe webhook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* The tag is what your website knows: page reads, where somebody came
            from, and the sign-up forms it can hear. It reads
            NEXT_PUBLIC_KICKLACE_KEY and NEXT_PUBLIC_KICKLACE_URL, and renders
            nothing — saying why in the console — when there is no key or the
            key is a secret one, because a component's output is in the page's
            source for anyone to read. */}
        <KicklaceTag />
      </body>
    </html>
  );
}
