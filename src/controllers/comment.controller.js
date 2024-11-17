import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "VideoId is not valid!!")
    }

    try {
        const skip = (page - 1) * limit;
        const pipeline = [
            // Match comments by videoId
            {
                $match: {
                    video: videoId
                }
            },
            // Sort comments by newest first (-1 -> ascending, 1 -> descending)
            {
                $sort: {
                    createdAt: -1
                }
            },
            // Pagination: Skip and limit
            {
                $skip: skip
            },
            {
                $limit: Number(limit)
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
        ];

        const comments = await Comment.aggregate(pipeline);
        if (!comments) {
            throw new ApiError(401, "User Details were not fetched!!")
        }

        const totalComments = await Comment.countDocuments({ video: videoId });
        if (!totalComments) {
            throw new ApiError(401, "totalComments were not fetched!!")
        }

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    comments,
                    totalComments,
                    totalPages: Math.ceil(totalComments / limit),
                    currentPage: Number(page),
                },
                "Details Successfully Fetched!!"
            )
        );
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while Fetching videoComments!!")
    }
});


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
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "commentID is not valid!!")
    }

    if (!content) {
        throw new ApiError(401, "Content is required!!")
    }

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(401, "Comment not found!!")
        }

        if (!comment.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthorized!! You are not allowed to update the comment!!")
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        )

        if (!updatedComment) {
            throw new ApiError(401, "Comment was not updated!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedComment,
                    "Comment was successfully updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating the comment!!")
    }

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "commentId was not valid!!")
    }

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(401, "Comment not found!!")
        }

        if (!comment.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthorized!! You are not allowed to update the comment!!")
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId)

        if (!deletedComment) {
            throw new ApiError(401, "Comment was not deleted!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Comment was deleted successfully!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while deleting the comment!!")
    }

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
