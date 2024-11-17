import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(401, "Content is required!!")
    }

    try {
        const tweet = await Tweet.create({
            owner: req.user?._id,
            content
        })

        if (!tweet) {
            throw new ApiError(401, "Tweet was not created!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    tweet,
                    "Tweet was successfully created!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while creating tweet!!")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "UserId is not valid!!")
    }

    try {
        const ownerTweets = await Tweet.find({ owner: userId })

        if (!ownerTweets) {
            throw new ApiError(401, "Tweets not found!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    ownerTweets,
                    "Tweets Successfully fetched!!"
                )
            )

    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching tweets!!")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "TweetId is not valid!!")
    }
    if (!content) {
        throw new ApiError(401, "Content is required!!")
    }

    try {
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(401, "Tweet not found!!")
        }

        if (!tweet.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthourized!! You are not allowed to update!!")
        }

        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        )

        if (!updateTweet) {
            throw new ApiError(401, "Tweet was not updated!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedTweet,

                    "Tweet was successfully updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating the tweet!!")
    }

})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "TweetId is not valid!!")
    }

    try {
        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(401, "Tweet not found!!")
        }

        if (!tweet.owner.equals(req.user?._id)) {
            throw new ApiError(402, "Unauthorized!! You are not allowed to delete!!")
        }

        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

        if (!deletedTweet) {
            throw new ApiError(401, "Tweet was not deleted!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Tweet was successfully deleted!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while deleting the tweet!!")
    }


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
