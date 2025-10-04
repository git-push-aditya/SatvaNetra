import type { Metadata } from "next";
import "./globals.css";
import Header from "./header";
import { ReactNode } from "react";
import { PageContextProvider } from "@/context/homeAbout";

export const metadata: Metadata = {
  title: "Satvanetra",
  description: "Deepfake detection application",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fff8f0] w-full">
        <PageContextProvider>
          <Header>{children}</Header>
        </PageContextProvider>
      </body>
    </html>
  );
}
