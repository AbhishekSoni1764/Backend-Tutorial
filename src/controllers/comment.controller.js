import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "VideoId is not valid!!")
    }
    if (!content) {
        throw new ApiError(401, "Content is required!!")
    }

    try {
        const commentOnVideo = await Comment.create({
            content,
            video: videoId,
            owner: req.user?._id
        })

        if (!commentOnVideo) {
            throw new ApiError(401, "Comment was not created!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    commentOnVideo,
                    "Comment was successfull!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while commenting!")
    }

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
