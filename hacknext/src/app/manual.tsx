"use client";
import { uploadFiles } from "@/lib/crud";
import { convertBlobUrlToFile } from "@/lib/utils";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import Loading from "./loadingSvg";
import ErrorAnimation from "./errorLottie";

export default function Manual() {
    const [stage, setStage] = useState<"selecting" | "uploading" | "detecting" | "done">("selecting");
    const [result, setResult] = useState<"notInitiated" | "fetching" | "hasValue" | "hasError">("notInitiated");
    const [file, setFile] = useState<File | null>(null);     //stores the file
    const [fileUrl, setFileUrl] = useState<string | null>(null);  //store the url of file just iploaded on browser
    const [cloudUrl, setCloudUrl] = useState<string>();  //stores the url return by supabase for imgae by user

    const [imageResult, setimageResult] = useState<File>(); 
    const [imageResultUrl, setImageResultUrl] = useState<string | null>()


    const [imgresultPdf, setimgresultPdf] = useState<File>(); 
    const [imgresultPdfUrl, setimgresultPdfUrl] = useState<string | null>()
    const [vidresultPdf, setVidresultPdf] = useState<File>(); 
    const [vidresultPdfUrl, setVidresultPdfUrl] = useState<string | null>()

    const [metadata, setMetadata] = useState<string>();


    const [stft, setStft] = useState<File>();
    const [fft, setFft] = useState<File>();
    const [stftUrl, setStftUrl] = useState<string | null>();
    const [fftUrl, setFftUrl] = useState<string | null>();
    const [mfcc, setMfcc] = useState<File>();
    const [mfccUrl, setMfccUrl] = useState<string | null>();

    const [fileType, setFileType] = useState<string | null>();

    const inputElRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();


    const imageExtensions = "jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|ico|heif|heic";
    const audioExtensions = "mp3|wav|aac|ogg|flac|m4a|wma|opus|aiff|alac|amr|mpga";
    const videoExtensions = "mp4|mkv|webm|mov|avi|wmv|flv|m4v|3gp|mpeg|mpg|ogv";

    const buttonStyle = "block w-[180px] md:w-[210px] mx-auto h-[45px] md:h-[60px] my-4 md:my-6 text-center bg-gradient-to-r from-[#ff8c33] to-[#ff6833] text-white rounded-lg text-sm md:text-lg cursor-pointer transition-all duration-300 font-bold shadow-[0_8px_25px_rgba(255,119,51,0.5)] py-[8px] md:py-[15px] uppercase hover:-translate-y-[5px] hover:w-[195px] hover:h-[50px] md:hover:w-[220px]  md:hover:h-[62px] hover:font-black hover:text-base md:hover:text-xl";

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
            await manualDetectionCall(supaCloudUrl!);
        });
    };
    
    const manualDetectionCall = async (cloudUrl: string) => {
        startTransition(async () => {
            const response = await fetch("http://10.10.0.203:3000/api/foreigncall", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cloudUrl,
                    detectionType: "manual",
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
        
            const { pdfUrl, imageUrl } = await response.json(); 
            const imageresponse = await fetch(imageUrl,{method : "GET"})
            const imageResultResponse = await fetch(pdfUrl,{method : "GET"})


            const imageBlob = await imageresponse.blob();
            const imageInstance = new File([imageBlob], "fft.png", { type: "image/png" });
            setimageResult(imageInstance);
            setImageResultUrl(URL.createObjectURL(imageInstance))

            const imageResultResponseBlob = await imageResultResponse.blob();
            const imageResultResponseBlobInstance = new File([imageResultResponseBlob], "imageResult.pdf", { type: "application/pdf" });
            setimgresultPdf(imageResultResponseBlobInstance);
            setimgresultPdfUrl(URL.createObjectURL(imageResultResponseBlobInstance));

        }else if(fileType === "audio"){
            const { fftUrl, stftUrl, mfccUrl, pdfUrl} = await response.json(); 

            const fftResponse = await fetch(fftUrl,{method : "GET"})
            const stftResponse = await fetch(stftUrl,{method : "GET"}) 
            const mfccResponse = await fetch(mfccUrl,{method : "GET"}) 
            const pdfResponse = await fetch(pdfUrl,{method : "GET"})

            const fftBlob = await fftResponse.blob();
            const fftInstance = new File([fftBlob], "fft.png", { type: "image/png" });
            setFft(fftInstance);

            const mfccBlob = await mfccResponse.blob();
            const mfccInstance = new File([mfccBlob], "mfcc.png", { type: "image/png" });
            setMfcc(mfccInstance);


            const stftBlob = await stftResponse.blob();
            const stftInstance = new File([stftBlob], "stft.png", { type: "image/png" });
            setStft(stftInstance);

            const imageResultResponseBlob = await pdfResponse.blob();
            const imageResultResponseBlobInstance = new File([imageResultResponseBlob], "imageResult.pdf", { type: "application/pdf" });
            setimgresultPdf(imageResultResponseBlobInstance);
            setimgresultPdfUrl(URL.createObjectURL(imageResultResponseBlobInstance));

 
            setFftUrl(URL.createObjectURL(fftInstance));
            setStftUrl(URL.createObjectURL(stftInstance));
            setMfccUrl(URL.createObjectURL(mfccInstance)); 

        } else{///video
            const { vidresultPdfUrl, pdfUrl } = await response.json(); 
            const pdfResponse = await fetch(pdfUrl,{method : "GET"})
            const videoResultResponse = await fetch(vidresultPdfUrl,{method : "GET"})

            const imageResultResponseBlob = await pdfResponse.blob();
            const imageResultResponseBlobInstance = new File([imageResultResponseBlob], "imageResult.pdf", { type: "application/pdf" });
            setimgresultPdf(imageResultResponseBlobInstance);
            setimgresultPdfUrl(URL.createObjectURL(imageResultResponseBlobInstance));

            const videoResultResponseBlob = await videoResultResponse.blob();
            const videoResultResponseBlobInstance = new File([videoResultResponseBlob], "videoResult.png", { type: "image/png" });
            setVidresultPdf(videoResultResponseBlobInstance);
            setVidresultPdfUrl(URL.createObjectURL(videoResultResponseBlobInstance));

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
                    Manual Detection System
                </div>
                <div className="mx-auto text-center my-7 text-base  md:text-lg px-4 md:w-3xl font-light font-sans text-[#666]">
                    Advanced system to analyze and detect manipulated media with high accuracy
                </div>

                <div className="bg-[rgba(255,255,255,0.9)] backdrop-blur-[15px] rounded-[16px] shadow-[0_15px_35px_rgba(255,119,51,0.2)] border border-[rgba(255,166,102,0.3)] w-4/5 xl:w-6xl mx-auto mt-20">
                    <div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-8 mb-10 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] pb-8">
                        <div className="text-center mt-10 px-4 text-2xl md:text-3xl text-[#ff7733] mx-auto font-bold">Upload Media for Manual Analysis</div>
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
                    {(result === "fetching" || result === "hasValue" || result === "hasError") &&<>
                        <div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-1 mb-14 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] ">
                            {isPending && <Loading></Loading>}
                            {result === "hasError" ? <> 
                                <ErrorAnimation /> 
                                <div className="mx-auto text-center mb-7 text-base  md:text-lg px-4 md:w-3xl font-light font-sans text-[#666]">Some backend error occured</div>
                                <button className={buttonStyle} onClick={handleReset}>Retry</button>
                                </> : ""}
                            {(result === "hasValue" && fileType === "image") &&<div>
                                <Image src={fileUrl!} className="mx-auto mt-6 h-[300px] w-[300px] rounded" width={300} height={300} alt={"selected file is     displayed"}></Image>
                                <Image src={imageResultUrl!} className=" mt-6 mx-auto h-[400px] rounded w-[400px] mb-4 " width={300} height={300} alt={"selected file is displayed"}></Image>
                                <iframe src={imgresultPdfUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe>
                                
                                <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button>
                                </div>}
                                {
                                    (result === "hasValue" && fileType === "audio") &&
                                    <div>
                                        <audio src={fileUrl!} className="mx-auto mt-6 " controls></audio>
                                    <div className="flex justify-around my-4">
                                        
                                        <Image src={stftUrl!} className=" mt-6 h-[300px] rounded w-[300px] " width={300} height={300} alt={"selected file is displayed"}></Image>
                                        <Image src={fftUrl!} className=" mt-6 h-[300px] w-[300px] mb-6" width={300} height={300} alt={"selected file is displayed"}></Image> 
                                        <Image src={mfccUrl!} className=" mt-6 h-[300px] w-[300px] mb-6" width={300} height={300} alt={"selected file is displayed"}></Image> 
                                        
                                    </div> 
                                        <iframe src={imgresultPdfUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe>
                                       
                                </div>
                              
                                }{
                                    (result === "hasValue" && fileType === "video")&&<div>
                                        <video src={fileUrl!} controls className="mx-auto mb-4 mt-6 h-[300px] w-[300px]" width={300} height={300}></video>
                                        <div>
                                            <div className="mx-auto my-2">
                                        <Image src={vidresultPdfUrl!} className="mx-auto mt-6 h-[300px] w-[300px] mb-6" width={300} height={300} alt={"selected file is displayed"}></Image>  </div><div>
                                        <iframe src={imgresultPdfUrl!} className="mx-auto mb-6" width="90%" height="600px"></iframe></div>
                                        
                                        </div>
                                    </div>
                                }
                        </div>
                        {  (result === "hasValue" && fileType === "audio") &&<div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-1 mb-14 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] px-4 pt-6 text-justify whitespace-pre-line">
    <div className="text-center text-black"> MFCC coefficients  </div>

    For natural voice samples :  <br/>
    The gradient of coefficients do not change drastically   <br/>
    For Vocoder voice samples :   <br/>
    The gradient of coefficients change drastically   <br/>

    <div className="text-center text-black"> Bilateral Fast Fourier Transform   </div>
    For natural voice samples :   <br/>
    The central frequency component is either drastically high or absent at f=0  <br/> 
    The amplitude changes are drastic around low frequencies   <br/>
    For Vocoder voice samples :   <br/>
    The central frequency component is present with low amplitude   <br/>
    High frequency component amplitudes are prominent   <br/>

    <button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>
        select other file
    </button>
</div>
}{(result === "hasValue" && (fileType === "video" || fileType === "image")) && <div className="bg-[rgba(255,243,235,0.8)] shadow-[0_8px_20px_rgba(255,119,51,0.1)] border border-[rgba(255,166,102,0.2)] border-1 rounded-lg mx-6 mt-1 mb-14 hover:-translate-y-2 duration-400 hover:shadow-[0_12px_30px_rgba(255,119,51,0.2)] px-4 pt-6 text-justify whitespace-pre-line pb-4">
    <div className="text-center text-black "> DCT coefficients</div> 
For natural Image samples : 
<div>The gradient of coefficients do not change drastically
High frequency coefficients are less prominent</div>
For GAN/Deepfake image samples : <div>
The gradient of coefficients change drastically 
High frequency coefficients are more prominent</div>
<div className="text-center text-black mt-2"> Power Spectral Densty </div>
For natural Image samples : <div>
The central frequency component is either drastically high or absent at f=0
The amplitude changes are drastic around low frequencies</div>
Less sharp texture (haralick features show reduced gradients)
<div className="text-black mt-2 mb-2"> For GAN/Deepfake Image samples :</div> 
     	
The central frequency component is present with low amplitude
High frequency component amplitudes are prominent 
More sharp texture (haralick features show steep gradients, proper signature of a GAN)
<button disabled={isPending} className={buttonStyle + ' md:w-[250px]  md:hover:w-[260px]'} onClick={handleReset}>select other file</button></div>}

</>}
                </div>
            </div>
        </div>
    );
}
