"use client";
import { usePageContext } from "@/context/homeAbout"
import { useRef } from "react";

export default function Auth( ){
    const {setIsAuthenticated} = usePageContext();
    const usernameRef = useRef<HTMLInputElement>(null!);
    const passwordRef = useRef<HTMLInputElement>(null!);
    const errorRef = useRef<HTMLDivElement>(null!);
    const buttonStyle = "block w-[280px]  md:w-[280px]  mx-auto h-[45px] md:h-[50px] my-4 md:my-6 text-center bg-gradient-to-r from-[#ff8c33] to-[#ff6833] text-white rounded-lg text-sm md:text-lg cursor-pointer transition-all duration-300 font-bold shadow-[0_8px_25px_rgba(255,119,51,0.5)] py-[4px] md:py-[10px] uppercase hover:-translate-y-[5px] hover:w-[290px] hover:h-[50px] md:hover:w-[290px]  md:hover:h-[62px] hover:font-black hover:text-base md:hover:text-xl";

    const inputStyle = "bg-[rgba(255,255,255,0.9)] pl-2 mx-auto w-[280px] h-[50px] bg-white bg-[rgba(255,255,255,0.9)] backdrop-blur-[15px] rounded-lg shadow-[0_15px_35px_rgba(255,119,51,0.2)] border border-[rgba(255,166,102,0.3)] mx-auto hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)]";

    const handleWorkflow = async () => {
        const userName = usernameRef.current.value;
        const password = passwordRef.current.value;
        const response = await fetch("http://10.10.0.203:3000/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userName,
                password
            }),
        });

        if (!response.ok) {
            if(response.status == 404){
            errorRef.current.innerHTML = "Wrong username entered";}
            else if(response.status == 401){
                errorRef.current.innerHTML = "Wrong password entered";
            }else{
                errorRef.current.innerHTML = "Wrong username/password entered";
            }
            return;
        }else{
            setIsAuthenticated(true);
        }
    }
    return(
        <div className="bg-white shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 mx-auto mt-[300px] rounded-lg mx-6 mt-8 mb-10 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] pb-8 w-3/7">
            <div>
                <div className="mx-auto text-center mt-6 text-[#FF7B39] font-bold max-w-screen-lg mt-6 md:max-w-3xl md:font-black text-3xl sm:text-4xl md:text-5xl font-sans">Satvanetra</div>
                <div className="text-center mt-4 px-4 text-sm md:text-base font-normal text-[#666]">Enter credentials</div>
            </div>
                <div className="flex flex-col justify-center mt-6 space-y-4">
                <input 
                    type="text" 
                    ref={usernameRef} 
                    className={inputStyle} 
                    placeholder="Username"
                />
                <input 
                    type="password" 
                    ref={passwordRef} 
                    className={inputStyle} 
                    placeholder="Password"
                />
            </div>
            <div ref={errorRef} className="text-center text-red-500 mt-4"></div>
            <button onClick={handleWorkflow} className={buttonStyle}>
                Log in
            </button>
        </div>
    )
}
