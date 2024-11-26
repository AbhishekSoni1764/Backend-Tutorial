import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscriber.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "UserId invalid!!")
    }

    try {
        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project: {
                    videoFile: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    owner: 1,
                    createdAt: 1

                }
            }
        ])

        if (!videos) {
            throw new ApiError(401, "No Videos were found!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videos,
                    "Channel Videos Successfully fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching channel videos!!")
    }
})

export {
    getChannelStats,
    getChannelVideos
}