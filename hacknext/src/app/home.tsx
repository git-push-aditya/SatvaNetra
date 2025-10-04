"use client";
import { uploadFiles } from "@/lib/crud";
import { convertBlobUrlToFile } from "@/lib/utils";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import Loading from "./loadingSvg";
import ErrorAnimation from "./errorLottie";

export default function Manual() {
    const [stage, setStage] = useState<"selecting" | "uploading" | "detecting" | "done">("selecting");
    const inputStyle = "bg-[rgba(255,255,255,0.9)] pl-2 mx-auto w-[260px] h-[50px] bg-white bg-[rgba(255,255,255,0.9)] backdrop-blur-[15px] rounded-lg shadow-[0_15px_35px_rgba(255,119,51,0.2)] border border-[rgba(255,166,102,0.3)] mx-auto hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)]";

    const [audioDeepfakeresult, setaudioDeepfakeresult] = useState<String>();
    const caseIdRef = useRef<HTMLInputElement>(null);
    const evidenceIdRef = useRef<HTMLInputElement>(null);

    const [result, setResult] = useState<"notInitiated" | "fetching" | "hasValue" | "hasError">("notInitiated");
    const [file, setFile] = useState<File | null>(null);     //stores the file
    const [fileUrl, setFileUrl] = useState<string | null>(null);  //store the url of file just iploaded on browser
    const [cloudUrl, setCloudUrl] = useState<string>();  //stores the url return by supabase for imgae by user

    const [vidresult, setvidresult] = useState<File>();
    const [vidresulturl, setvidresulturl] = useState<string | null>();


    const [imageResult, setimageResult] = useState<string>(); 
    const [imagepdf, setimagepdf] = useState<File>();
    const [imageResultUrl, setImageResultUrl] = useState<string | null>();

    const [vidresultPdf, setVidresultPdf] = useState<File>(); 
    const [vidresultPdfUrl, setVidresultPdfUrl] = useState<string | null>()


    const [fileType, setFileType] = useState<string | null>();

    const inputElRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();


    const imageExtensions = "jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|ico|heif|heic";
    const audioExtensions = "mp3|wav|aac|ogg|flac|m4a|wma|opus|aiff|alac|amr|mpga";
    const videoExtensions = "mp4|mkv|webm|mov|avi|wmv|flv|m4v|3gp|mpeg|mpg|ogv";

    const buttonStyle = "block w-[180px] md:w-[260px] mx-auto h-[45px] md:h-[50px] my-4 md:my-6 text-center bg-gradient-to-r from-[#ff8c33] to-[#ff6833] text-white rounded-lg text-sm md:text-lg cursor-pointer transition-all duration-300 font-bold shadow-[0_8px_25px_rgba(255,119,51,0.5)] py-[8px] md:py-[10px] uppercase hover:-translate-y-[5px] hover:w-[195px] hover:h-[50px] md:hover:w-[280px]  md:hover:h-[62px] hover:font-black hover:text-base md:hover:text-xl";

    const handleReset = () => {
        setStage("selecting");
        setFile(null);
        setFileUrl(null);
        setCloudUrl(""); 
        setResult("notInitiated");
    }

    const handleSelecting = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
            setStage("uploading");
            setFileUrl(URL.createObjectURL(selectedFile));
     
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || "";
     
            setFileType(
                imageExtensions.split('|').includes(fileExtension) ? "image" :
                audioExtensions.split('|').includes(fileExtension) ? "audio" :
                videoExtensions.split('|').includes(fileExtension) ? "video" :
                "unknown"
            );
            console.log(fileType);
        } else {
            alert("Retry uploading");
        }
    };
    


    const uploadToSupabase = async () => {
        startTransition(async () => {
            const newFileUrl = await convertBlobUrlToFile(fileUrl!);
    
            const { supaCloudUrl, error } = await uploadFiles({ file: newFileUrl, bucket: "raw-files" });
    
            if (error) {
                console.error(error);
                alert("Couldn't upload file (-_-) . . Try again later");
                return;
            }
    
            setCloudUrl(supaCloudUrl);
            console.log(supaCloudUrl);
            setStage("detecting"); 
             
            // Pass supaCloudUrl directly instead of referencing cloudUrl
            await deepfakeDetectionCall(supaCloudUrl!);
        });
    };
    
    const deepfakeDetectionCall = async (cloudUrl: string) => {
        startTransition(async () => {
            const response = await fetch("/api/foreigncall", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cloudUrl,
                    detectionType: "deepfake",
                    fileType
                }),
            });
    
            if (!response.ok) {
                console.log("issueee")
                setStage("done");
                setResult("hasError");
                return;
            }
            if(fileType === "image"){ 
        
                const { deepfake_result,pdfUrl } = await response.json(); 
                setimageResult(deepfake_result);
                const imgResultResponse = await fetch(pdfUrl,{method : "GET"})

                const imgResultResponseBlob = await imgResultResponse.blob();
                const imgResultResponseBlobInstance = new File([imgResultResponseBlob], "imageResult.pdf", { type: "application/pdf" });
                setimagepdf(imgResultResponseBlobInstance);
                setImageResultUrl(URL.createObjectURL(imgResultResponseBlobInstance));

        }else if(fileType === "audio"){
            const { deepfake_result,pdfUrl } = await response.json(); 
            setaudioDeepfakeresult(deepfake_result);
            const imgResultResponse = await fetch(pdfUrl,{method : "GET"})

                const imgResultResponseBlob = await imgResultResponse.blob();
                const imgResultResponseBlobInstance = new File([imgResultResponseBlob], "audioResult.pdf", { type: "application/pdf" });
                setimagepdf(imgResultResponseBlobInstance);
                setImageResultUrl(URL.createObjectURL(imgResultResponseBlobInstance));

        } else{///video
            const { vidResultUrl,pdfUrl } = await response.json(); 
            const videoResultResponse = await fetch(vidResultUrl,{method : "GET"}) 
            const videoResultResponsepdf = await fetch(pdfUrl,{method : "GET"})
/*
    const [vidresult, setvidresult] = useState<File>();
    const [vidresulturl, setvidresulturl] = useState<string | null>(); */
            const videoResultResponseBlob = await videoResultResponse.blob();
            const videoResultResponseBlobInstance = new File([videoResultResponseBlob], "videoResult.pdf", { type: "application/pdf" });
            setvidresult(videoResultResponseBlobInstance);
            setvidresulturl(URL.createObjectURL(videoResultResponseBlobInstance));

            const videoResultResponsepdfBlob = await videoResultResponsepdf.blob();
            const videoResultResponsepdfBlobInstance = new File([videoResultResponsepdfBlob], "videoResult.pdf", { type: "application/pdf" });
            setVidresultPdf(videoResultResponsepdfBlobInstance);
            setVidresultPdfUrl(URL.createObjectURL(videoResultResponsepdfBlobInstance));

        }
            setStage("done");
            setResult("hasValue");
             
        });
    };
     

    const handleWorkFlow = () => {
        setResult("fetching");
        uploadToSupabase();
    };
    
    return (
        <div className="pt-24 z-0">
            <div className="mt-20 md:mt-27">
                <div className="mx-auto text-center text-[#FF7B39] font-bold max-w-screen-lg md:max-w-3xl md:font-black text-3xl sm:text-4xl md:text-5xl font-sans">
                    Deepfake Detection System
                </div>
                <div className="mx-auto text-center my-7 text-base  md:text-lg px-4 md:w-3xl font-light font-sans text-[#666]">
                    Advanced Ai system to analyze and detect manipulated media with high accuracy
                </div>

                <div className="bg-[rgba(255,255,255,0.9)] backdrop-blur-[15px] rounded-[16px] shadow-[0_15px_35px_rgba(255,119,51,0.2)] border border-[rgba(255,166,102,0.3)] w-4/5 xl:w-6xl mx-auto mt-20">
                    <div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-8 mb-10 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] pb-8">
                        <div className="text-center mt-10 px-4 text-2xl md:text-3xl text-[#ff7733] mx-auto font-bold">Upload Media for Deepfake Analysis</div>
                        <div className="text-center mt-4 px-4 text-sm md:text-base font-normal text-[#666]">Select an image, video, or audio file to detect potential manipulation</div>
                        
                        

                        <div className="md:w-xl mx-auto">
                            <input type="file" ref={inputElRef} className="hidden" onChange={handleSelecting} disabled={isPending} accept="image/*,video/*,audio/*">
                            </input>

                            {(stage === "selecting" && file === null) &&
                                <button className={buttonStyle} disabled={isPending} onClick={() => { inputElRef.current?.click() }}> Upload a file</button>}

                            {(stage === "uploading" && !isPending) &&
                                <><div className='text-center px-4 text-base md:text-lg mt-10 text-[#ff7733]'> Selected file : {file?.name}</div>
                                    <div>

                                        {imageExtensions.split('|').includes(file?.name?.slice(file.name.lastIndexOf('.') + 1)!) &&
                                            <Image src={fileUrl!} className="mx-auto mt-6 h-[300px] w-[300px]" width={300} height={300} alt={"selected file is     displayed"}></Image>}

                                        {audioExtensions.split('|').includes(file?.name?.slice(file.name.lastIndexOf('.') + 1)!) &&
                                            <audio src={fileUrl!} className="mx-auto mt-6 " controls></audio>}

                                        {videoExtensions.split('|').includes(file?.name?.slice(file.name.lastIndexOf('.') + 1)!) &&
                                            <video src={fileUrl!} controls className="mx-auto mt-6 h-[300px] w-[300px]" width={300} height={300}></video>}


                                    </div>
                                    <div className="md:flex">
                                        <button disabled={isPending} className={buttonStyle + ' md:w-[250px] px-2 md:hover:w-[260px]'} onClick={handleWorkFlow}> Continue detection </button>
                                        <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button>
                                    </div>

                                </>}
                        </div>
                    </div>
                    {(result === "fetching" || result === "hasValue" || result === "hasError") &&
                        <div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-1 mb-14 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] ">
                            {isPending && <Loading></Loading>}
                            {result === "hasError" ? <>
                            {fileType}
                                <ErrorAnimation /> 
                                <div className="mx-auto text-center mb-7 text-base  md:text-lg px-4 md:w-3xl font-light font-sans text-[#666]">Some backend error occured</div>
                                <button className={buttonStyle} onClick={handleReset}>Retry</button>
                                </> : ""}
                            {(result === "hasValue" && fileType === "image") &&<div>
                                <Image src={fileUrl!} className="mx-auto mt-6 h-[300px] w-[300px] rounded" width={300} height={300} alt={"selected file is     displayed"}></Image>
                                
                                <div className="text-center px-4 my-4 text-lg font-black">Confidence score :  {imageResult}</div>
                                <iframe src={imageResultUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe>
                                <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button>
                                </div>}
                                {
                                    (result === "hasValue" && fileType === "audio") &&
                                <div>
                                        <audio src={fileUrl!} className="mx-auto mt-6 mb-6" controls></audio>
                                    <div > 
                                        <div className="text-center px-4 my-4 text-lg font-black">Confidence score : {audioDeepfakeresult}</div>
                                        <div className="mx-auto mb-4 mb-4"><iframe src={imageResultUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe></div>
                                    </div>
                                    <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button>
                                </div>
                                }{
                                    (result === "hasValue" && fileType === "video")&&<div>
                                        <div>
                                        <video src={fileUrl!} controls className="mx-auto mb-4 mt-6 h-[300px] w-[300px]" width={300} height={300}></video>
                                         </div>
                                         <div>
                                        <video src={vidresulturl!} controls className="mx-auto mb-4 mt-6 h-[300px] w-[300px]" width={300} height={300}></video>
                                        </div>
                                         <div>
                                        <iframe src={vidresultPdfUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe>
                                        </div><div>
                                        <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button>
                                        </div>
                                    </div>
                                }
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

/*
{(stage === "selecting" && file === null) &&<div className="flex flex-col justify-center mt-6 space-y-4">
  <input className={inputStyle} type="text" ref={caseIdRef} placeholder="Case ID" />
  <input className={inputStyle} type="text" ref={evidenceIdRef} placeholder="Evidence Id" />
</div>}
*/
