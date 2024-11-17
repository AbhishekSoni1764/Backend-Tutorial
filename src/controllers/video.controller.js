import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    const thumbnailLocalFile = req.files?.thumbnail[0]?.path
    const videoLocalFile = req.files?.videoFile[0]?.path

    if (!(title && description) || !(thumbnailLocalFile && videoLocalFile)) {
        throw new ApiError(401, "All Fields are required!!")
    }

    try {
        const user = await User.findById(req.user?._id)

        const videoFile = await uploadVideoOnCloudinary(videoLocalFile);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

        if (!videoFile?.secure_url) {
            throw new ApiError(400, "Video File not Uploaded")
        }
        if (!thumbnail?.secure_url) {
            throw new ApiError(400, "Thumbnail not Uploaded")
        }

        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.secure_url,
            thumbnail: thumbnail.secure_url,
            duration: videoFile.duration,
            views: 200,
            isPublished: true,
            owner: user._id
        })

        if (!video) {
            throw new ApiError(500, "Something Went Wrong. Video Object was not Created!!")
        }

        return res.status(201).json(
            new ApiResponse(200, video, "Video Object Successfully Created!!!")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something Went wrong while Creating Video Object")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    try {
        const video = await Video.findById(videoId)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    { video },
                    "Video Successfully Fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching the video")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { title, description } = req.body
    const thumbnailLocalFile = req.file?.path

    if (!title || !description || !thumbnailLocalFile) {
        throw new ApiError(401, "All Fields are Required!!!")
    }

    try {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description,
                    thumbnail: thumbnail?.secure_url,
                }
            },
            {
                new: true
            }
        )

        if (!video) {
            throw new ApiError(402, "Video Object was not updated successfully!!");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    video,
                    "Video Object was successfully Updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating video details!!")
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(401, "Video Id was not accessable!!")
    }
    try {
        const video = await Video.findByIdAndDelete(videoId)
        console.log(video);

        if (!video) {
            throw new ApiError(401, "Video object was not deleted!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    {},
                    "Video Object was Successfully deleted!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while deleting the video object!")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
