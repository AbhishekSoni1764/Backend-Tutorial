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
        fs.unlinkSync(localFilePath)
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
                    // console.error("Cloudinary upload error:", error);
                    reject(error);
                } else {
                    // console.log("Cloudinary upload result:", result);
                    resolve(result);
                }
            });
        });
        fs.unlinkSync(localVideoPath)
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localVideoPath)
        throw new ApiError(400, error?.message || "Something went wrong while uploading the video");
    }
};

const deleteFromCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;
        const fileName = filePath.split("/").pop().split(".")[0];
        const resourceType = filePath.includes("image") ? "image" : "video";

        const deleteResult = await cloudinary.uploader.destroy(fileName, {
            resource_type: resourceType,
        });

        console.log("File is Successfully Deleted");
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return deleteResult;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return null;
    }
};



export { uploadOnCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary }