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

    try {
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
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while toggling Subscriptions!!")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "ChannelId is inValid!!")
    }

    try {
        const channelUser = await Subscription.findOne({ channel: channelId });

        if (!channelUser) {
            throw new ApiError(401, "User Not Found for this channel!!")
        }

        if (!channelUser.channel.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthorized!! You are not allowed to fetch userChannels!!")
        }
        const subscriber = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'subscribers',
                    foreignField: "_id",
                    as: "subscriber",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    subscriber: {
                        $first: "$subscriber"
                    }
                }
            },
            {
                $project: {
                    subscriber: 1,
                    createdAt: 1
                }
            }
        ])

        if (!subscriber) {
            throw new ApiError(401, "Subscribers not found!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subscriber,
                    "UserChannel Subscribers successfully fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while Fetching userChannel Subscribers!!")
    }
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