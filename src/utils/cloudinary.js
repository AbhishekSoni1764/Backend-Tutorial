import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath, {
                resource_type: "auto"
            }
            )
            .catch((error) => {
                console.log(error);
            });
        console.log("File is Successfully Uploaded");
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}


const uploadVideoOnCloudinary = async (localVideoPath) => {
    try {
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(localVideoPath, { resource_type: "video" }, (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(error);
                } else {
                    console.log("Cloudinary upload result:", result);
                    resolve(result);
                }
            });
        });
        return uploadResult;
    } catch (error) {
        console.error("Error during Cloudinary upload:", error);
        throw new ApiError(400, error?.message || "Something went wrong while uploading the video");
    }
};



export { uploadOnCloudinary, uploadVideoOnCloudinary }