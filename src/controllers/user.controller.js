import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


//generate AccessToken and RefreshToken
const generateAccessTokenAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Server Error. AccessToken and RefreshToken Not Generated!!")
    }
}

//User Register
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullName, username, password, email } = req.body;

    if ([fullName, username, password, email].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    try {

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            throw new ApiError(409, "User with this username or email already exists.!!!")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar Local File Not Found")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar file not Uploaded")
        }

        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            password,
            avatar: avatar.url,
            coverImage: coverImage.url || "",
            email
        })


        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        if (!createdUser) {
            throw new ApiError(500, "Something Went Wrong. User was not Registered!!")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User Successfully Registered!!!")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while registering the user!!!")
    }
});

//User Login
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username and Password are required!!")
    }

    try {
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (!user) {
            throw new ApiError(401, "User not found!!")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);

        if (!isPasswordCorrect) {
            throw new ApiError(404, "User Password is Incorrect!!")
        }

        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, refreshToken, accessToken
                    },
                    "User Successfully LoggedIn"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while login!!")
    }
});

//User Logout
const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.body._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true,
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(201, {}, "User Successfully LoggedOut!!")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while logging user out!!")
    }
});

//RefreshToken Check and Generation
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No Refresh Token Recieved!!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "User not Found !!")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Toekn does not match!!")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed!"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized Access and Token not Refreshed!!")
    }

})

//change UserPassword
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if ([oldPassword, newPassword].some((field) => field?.trim() === "")) {
        throw new ApiError(401, "All Fields are required!")
    }

    try {
        const user = await User.findById(req.user?._id);
        const isOldPassCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isOldPassCorrect) {
            throw new ApiError(402, "Old Password is Incorrect !!")
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User Password Successfully Changed!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while changing password!!")
    }
})

//get currentUser
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "User Data Successfully Fetched"
            )
        )
})

//Updating Account Details
const updateFullNameAndEmail = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(401, "All Fields are required!")
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email: email
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "User fullname/email updated"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating fullname/email!!")
    }
})

//update userAvatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Local Image Not recieved!")
    }

    try {
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar && !avatar?.url) {
            throw new ApiError(401, "Image Was not uploaded to Cloudinary Successfully!!")
        }

        const user = await User.findOneAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        ).select("-password")


        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    user,
                    "User Avatar Successfully updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Somehting went wrong while updating the avatar!!")
    }
})

//update userAvatar
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(401, "Local Image Not recieved!")
    }

    try {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage && !coverImage?.url) {
            throw new ApiError(401, "Image Was not uploaded to Cloudinary Successfully!!")
        }

        const user = await User.findOneAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password")


        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    user,
                    "User CoverImage Successfully updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Somehting went wrong while updating the avatar!!")
    }
})


// <- Important Stuff ->
//get userChannelProfile -> Aggregate Pipelines for basically conneting multiple documents and fetching collective data.
const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(401, "Username doesn't exists!!")
    }

    try {
        const channel = await User.aggregate([
            //Match Pipline to get all docs with this username
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            //Get all Subscribers for this perticular username -> Subscribers Pipeline
            {
                $lookup: {
                    from: "subscribers",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            //Get all Channels Subscribed by this particular Username -> Channel Pipeline
            {
                $lookup: {
                    from: "subscribers",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            //AddFields Pipeline -> adds new values to the user document.
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            //Projection Pipeline -> projects all the required values as the response
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    email: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                }
            }
        ])

        if (!channel.length) {
            throw new ApiError(404, "Channel Not Found!!")
        }

        //Channel is an array and its 0th value is the object that we require so we will send that as a response.
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channel[0],
                    "User Channel Successfully Fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while getting user channel profile!!")
    }
})

//get userWatchHistory
const getUserWatchHistory = asyncHandler(async (req, res) => {
    try {
        const user = await User.aggregate([
            //get id from mongoose using -> Match Pipeline
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            //Lookup Pipelines -> for connecting and fetching data from multiple documents -> subpipelining
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            //add new field to user model -> addfields Pipeline
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            }
        ])

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user[0]?.watchHistory,
                    "User watch history successsfully fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while getting watchhistory!!")
    }
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateFullNameAndEmail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
};
