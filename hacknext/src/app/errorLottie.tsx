"use client";  

import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "@/app/Animation - 1741180829745.json";  

const AnimationComponent = () => {
  return (
    <div className="flex justify-center items-center bg-[rgba(255,243,235,0.8)]">
      <Lottie animationData={animationData} className="w-[300px] h-[300px]" />
    </div>
  );
};

export default AnimationComponent;
