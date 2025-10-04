import { NextResponse } from "next/server";

export async function POST(req : Request){ 

    try{
        const { cloudUrl , detectionType, fileType } = await req.json();

        if(!cloudUrl || !detectionType){
            return NextResponse.json({message: "Incomplete request"}, {status : 400});
        }

        const flaskResponse = await fetch("http://127.0.0.1:5000/analyze", {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body : JSON.stringify({cloudUrl, detectionType})
        })
    
        

        if (!flaskResponse.ok) {
            console.log(flaskResponse);
            return NextResponse.json({
                message: "ML issue, couldn't generate report...",
                error: `Flask backend responded with ${flaskResponse.status}`,
            }, { status: 500 });
        }

            if(detectionType === "manual"){
                if(fileType === "image"){
                    
                    const { pdfUrl, imageUrl } = await flaskResponse.json();
                    console.log("Received URLs from API:", pdfUrl);


                    if(!pdfUrl){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 


                    return NextResponse.json({
                        message : "Processed Successfully ",
                        pdfUrl, imageUrl
                    },{status : 200});
                }else if(fileType === "audio"){
                    
                    const {fftUrl, stftUrl, mfccUrl,pdfUrl } = await flaskResponse.json();
                    console.log("Received URLs from API:", fftUrl, stftUrl);


                    if(!stftUrl || !fftUrl || !mfccUrl  ){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 

                    console.log(fftUrl, stftUrl)

                    return NextResponse.json({
                        message : "Processed Successfully ",
                        fftUrl, stftUrl, mfccUrl, pdfUrl
                    },{status : 200});
                }else if(fileType === "video"){ 
                    const {vidresultPdfUrl, pdfUrl } = await flaskResponse.json();
                    console.log("Received URLs from API:", vidresultPdfUrl);


                    if(!vidresultPdfUrl){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 

                    console.log(vidresultPdfUrl)

                    return NextResponse.json({
                        message : "Processed Successfully ",
                        vidresultPdfUrl,pdfUrl
                    },{status : 200});

            }else {
                throw new Error;
            }
        }else {  //deepfake
            if(fileType === "audio"){
                const {deepfake_result,pdfUrl} = await flaskResponse.json();
                    console.log("Audio deepfake result: ",deepfake_result);


                    if(!deepfake_result){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 

                    console.log(deepfake_result)

                    return NextResponse.json({
                        message : "Processed Successfully ",
                        deepfake_result,pdfUrl
                    },{status : 200});
            }else if(fileType === "video"){
                    const {vidResultUrl,pdfUrl} = await flaskResponse.json();
                    console.log("Received URLs from API:", vidResultUrl);


                    if(!vidResultUrl){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 

                    console.log(vidResultUrl)

                    return NextResponse.json({
                        message : "Processed Successfully ",
                        vidResultUrl,pdfUrl
                    },{status : 200});
            }else{
                const {deepfake_result,pdfUrl} = await flaskResponse.json();
                    console.log("Received URLs from API:", deepfake_result,pdfUrl);


                    if(!deepfake_result){
                        return NextResponse.json({
                            message : "ML issue, could'nt generate report..."
                        },{status :300})
                    } 

                    console.log(deepfake_result,pdfUrl)

                    return NextResponse.json({
                        message : "Processed Successfully ",
                        deepfake_result,pdfUrl
                    },{status : 200});
            }
            
        }

    }catch(e  :any){
        console.log(e.message);
        return NextResponse.json({
            message: "error occured/ backend crashed",
            specificError : e.message
        },{status: 500});
    }
}
