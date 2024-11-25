import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscriber.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "ChannelId is not valid!!")
    }

    const subscriber = await Subscription.findOne({
        $and: [{ channel: channelId }, { subscribers: req.user?._id }]
    })

    if (!subscriber) {
        const subscribe = await Subscription.create({
            channel: channelId,
            subscribers: req.user?._id,
        })

        if (!subscribe) {
            throw new ApiError(401, "Subscription unsuccessfull!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subscribe,
                    "Subscription Successfull!!"
                )
            )
    }

    const unsubscribe = await Subscription.findByIdAndDelete(subscriber?._id)

    if (!unsubscribe) {
        throw new ApiError(401, "Unsubscription Unsuccessfull!!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Unsubscription Successfull!!"
            )
        )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}