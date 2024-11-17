import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "VideoId is not valid!");
    }

    try {
        const user = req.user?._id;

        if (!user) {
            throw new ApiError(401, "User not found!");
        }

        const isLiked = await Like.findOne({
            video: videoId,
            likedBy: user
        });

        if (!isLiked) {
            const likeVideo = await Like.create({
                video: videoId,
                likedBy: user
            });

            if (!likeVideo) {
                throw new ApiError(401, "Video was not liked!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Video liked successfully!")
            );
        } else {
            const unLikeVideo = await Like.findByIdAndDelete(isLiked._id);
            if (!unLikeVideo) {
                throw new ApiError(401, "Video's like was not removed!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Video unliked successfully!")
            );
        }
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "Something went wrong while toggling the like!"
        );
    }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "VideoId is not valid!");
    }

    try {
        const user = req.user?._id;

        if (!user) {
            throw new ApiError(401, "User not found!");
        }

        const isLiked = await Like.findOne({
            comment: commentId,
            likedBy: user
        });

        if (!isLiked) {
            const likeComment = await Like.create({
                comment: commentId,
                likedBy: user
            });

            if (!likeComment) {
                throw new ApiError(401, "Comment was not liked!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Comment liked successfully!")
            );
        } else {
            const unLikeComment = await Like.findByIdAndDelete(isLiked._id);
            if (!unLikeComment) {
                throw new ApiError(401, "Comment's like was not removed!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Comment unliked successfully!")
            );
        }
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "Something went wrong while toggling the like!"
        );
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "tweetId is not valid!");
    }

    try {
        const user = req.user?._id;

        if (!user) {
            throw new ApiError(401, "User not found!");
        }

        const isLiked = await Like.findOne({
            tweet: tweetId,
            likedBy: user
        });

        if (!isLiked) {
            const likeTweet = await Like.create({
                tweet: tweetId,
                likedBy: user
            });

            if (!likeTweet) {
                throw new ApiError(401, "Tweet was not liked!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Tweet liked successfully!")
            );
        } else {
            const unLikeTweet = await Like.findByIdAndDelete(isLiked._id);
            if (!unLikeTweet) {
                throw new ApiError(401, "Tweet's like was not removed!");
            }

            return res.status(200).json(
                new ApiResponse(200, {}, "Tweet unliked successfully!")
            );
        }
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "Something went wrong while toggling the like!"
        );
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { _id } = req.user?._id;

    try {
        if (!isValidObjectId(_id)) {
            throw new ApiError(401, "UserId is not Valid!!")
        }

        // Aggregation pipeline
        const pipeline = [
            {
                $match: {
                    likedBy: _id
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videoId",
                    foreignField: "_id",
                    as: "videoDetails",
                },
            },
            {
                $unwind: "$videoDetails"
            },
            {
                $project: {
                    _id: 0,
                    videoId: "$videoId",
                    title: "$videoDetails.title",
                    thumbnail: "$videoDetails.thumbnail",
                    createdAt: "$videoDetails.createdAt",
                },
            },
        ];

        const likedVideos = await Like.aggregate(pipeline);

        if (!likedVideos) {
            throw new ApiError(401, "Data was not fetched!!")
        }

        res.status(200).json(
            new ApiResponse(
                200,
                likedVideos,
                "Video Details were successfully fetched!!"
            )
        );
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching details!!")
    }
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}