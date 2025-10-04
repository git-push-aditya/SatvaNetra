import { v4 as uuidv4 } from "uuid";
import { getSupabaseClientInstance } from "./supabaseClient";

interface uploadPropType {
    file: File,
    bucket: string,
    folder?: string
}

export const uploadFiles = async ({ file, bucket, folder }: uploadPropType) => {
    const fileName = file.name;
    const extension = fileName.slice(fileName.lastIndexOf('.') + 1);
    const path = `${folder ? folder + "/" : ""}${uuidv4()}.${extension}`;

    //no compression for now

    const { storage } = getSupabaseClientInstance();

    const { data, error } = await storage.from(bucket).upload(path, file);

    if (error) {
        console.error(error);
        return { imageUrl: "", error: "Error uploading the image to cloud" };
    }

    const supaCloudUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${bucket}/${data?.path}`;
    console.log(supaCloudUrl);
    return { supaCloudUrl, error: "" };

}

