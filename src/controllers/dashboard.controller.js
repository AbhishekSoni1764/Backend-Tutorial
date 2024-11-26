import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscriber.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "UserId is not valid!!")
    }

    try {
        const totalChannelViewsAndVideos = await Video.aggregate([
            [
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: "$owner",
                        totalChannelViews: {
                            $sum: "$views"
                        },
                        totalVideos: {
                            $sum: 1
                        }
                    }
                }
            ]
        ])

        if (!totalChannelViewsAndVideos) {
            throw new ApiError(401, "No Videos exists for this User!!")
        }

        const getTotalChannelSubscribers = await Subscription.aggregate([
            [
                {
                    $match: {
                        channel: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: "$channel",
                        totalChannelSubscribers: {
                            $sum: 1
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalChannelSubscribers: 1
                    }
                }
            ]
        ])

        if (!getTotalChannelSubscribers) {
            throw new ApiError(401, "No Subscribers for this User!!")
        }

        const getTotalLikes = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoInfo"
                }
            },
            {
                $lookup: {
                    from: "tweets",
                    localField: "tweet",
                    foreignField: "_id",
                    as: "tweetInfo"
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "comment",
                    foreignField: "_id",
                    as: "commentInfo"
                }
            },
            {
                $group: {
                    _id: "$likedBy",
                    totalVideoLikes: {
                        $sum: {
                            $size: "$videoInfo"
                        }
                    },
                    totalTweetLikes: {
                        $sum: {
                            $size: "$tweetInfo"
                        }
                    },
                    totalCommentLikes: {
                        $sum: {
                            $size: "$commentInfo"
                        }
                    }
                }
            }
        ])

        if (!getTotalLikes) {
            throw new ApiError(401, "No Likes for this User!!")
        }

        const totalLikes = {
            totalChannelViews: totalChannelViewsAndVideos[0]?.totalChannelViews,
            totalChannelVideos: totalChannelViewsAndVideos[0]?.totalVideos,
            totalChannelSubscribers: getTotalChannelSubscribers[0]?.totalChannelSubscribers,
            totalLikes: {
                totalVideoLikes: getTotalLikes[0]?.totalVideoLikes,
                totalTweetLikes: getTotalLikes[0]?.totalTweetLikes,
                totalCommentLikes: getTotalLikes[0]?.totalCommentLikes
            }
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    totalLikes,
                    "Total Likes Successfully Fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching channel stats!!")
    }
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