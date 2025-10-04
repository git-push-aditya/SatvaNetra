"use client";
import { usePageContext } from "@/context/homeAbout";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Header({ children }: Readonly<{ children: ReactNode }>) {
  const tagHover =
    "tracking-wide transition-all duration-300 ease-in-out hover:text-[#ff7733] ";
  const underline =
    "relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#ff6833] after:to-[#ff8c33] after:rounded after:transition-all after:duration-300 hover:after:w-full py-3";

  const { page, setPage, isAuthenticated } = usePageContext();

  return (
  
    <>
      
       <div className="flex flex-row justify-between items-center h-20 fixed top-0 left-0 right-0 px-8 md:px-15 shadow-[0_10px_30px_rgba(255,123,57,0.2)] z-[1000] backdrop-blur-lg">
        <div className="text-[#FF7B39] text-3xl md:text-4xl font-semibold md:font-black antialiased cursor-default flex">
          Satvanetra
        </div>

        <div className="hidden md:flex flex-row font-medium text-base cursor-pointer space-x-12">
          <div className={tagHover + underline} onClick={() => setPage("Home")}>
            Home
          </div>
          <div className={tagHover + underline} onClick={() => setPage("Manual")}>
            Manual
          </div>
          <div className={tagHover + underline} onClick={() => setPage("About")}>
            About
          </div>
        </div>
      </div>

      {children}

      <div className="bg-white mx-auto my-6 md:my-12 text-base text-center py-4 md:py-8 px-6 md:px-12 shadow-lg rounded-lg  w-3/5">
        SatvaNetra | DeepFake Detection System © 2025 | Hackathon Project
      </div>

    </>)
    
}
