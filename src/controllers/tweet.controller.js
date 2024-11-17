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
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
