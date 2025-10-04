"use client";
import { usePageContext } from "@/context/homeAbout";
import Homepage from "./home";
import About from "./about";
import Manual from "./manual"; 

export default function Home() {
  const {page,setPage,isAuthenticated, setIsAuthenticated} = usePageContext();
  return (
    <div className="h-screen bg-[#fff8f0]">
        {isAuthenticated ? (
            page === "Manual" ? <Manual /> : 
            page === "Home" ? <Homepage /> : 
            <About />
          ) : (
             page === "Manual" ? <Manual /> : 
            page === "Home" ? <Homepage /> : 
            <About />
          )}

    </div>
  );
}


