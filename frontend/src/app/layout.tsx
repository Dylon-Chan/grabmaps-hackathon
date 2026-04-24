import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuestPass SG",
  description: "Turn a Singapore layover into a time-safe city quest."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
