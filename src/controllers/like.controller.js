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
            // If not liked, create a like
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
            // If already liked, remove the like
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
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}