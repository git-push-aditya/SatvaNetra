//converts the image to a file
export async function convertBlobUrlToFile(blobUrl: string) {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  
  
  let mimeType = blob.type;
  if (!mimeType || mimeType === "application/octet-stream") {
      mimeType = "audio/wav"; // Default to WAV if unsure
  }
  
  
  const extension = mimeType.split("/")[1] || "wav"; // Default to .wav
  const fileName = `${Math.random().toString(36).slice(2, 9)}.${extension}`;
  
  
  const file = new File([blob], fileName, { type: mimeType });
  return file;
}