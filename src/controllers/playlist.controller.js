import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(401, "All Fields are required!!")
    }

    try {

        const isAlreadyExists = await Playlist.findOne({
            $and: [{ name }, { description }]
        })

        if (isAlreadyExists) {
            throw new ApiError(403, "Playlist Already exists!")
        }

        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user?._id
        })

        if (!playlist) {
            throw new ApiError(401, "Playlist not created!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "Playlist was successfully created!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while creating the playlist!!")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "UserId is not valid!!")
    }

    try {
        const playlists = await Playlist.find({ owner: userId })

        if (!playlists || !playlists.length > 0) {
            throw new ApiError(401, "Playlists not found or is empty!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlists,
                    "Playlists were Successfully fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching the playlists!!")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "playlistId was not valid!!")
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(401, "Playlist was not found!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "Playlist was successfully fetched!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching playlist!!")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Playlist ID or Video ID is not valid!");
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(402, "Playlist not found!");
        }

        if (!playlist.owner.equals(req.user._id)) {
            throw new ApiError(403, "You are not allowed to modify this playlist!");
        }

        const videoExists = playlist.videos.some((video) => video.toString() === videoId);

        if (videoExists) {
            throw new ApiError(401, "Video already exists in the playlist!");
        }

        const addedVideo = await Playlist.findByIdAndUpdate(
            playlistId,
            { $push: { videos: videoId } },
            { new: true }
        );

        if (!addedVideo) {
            throw new ApiError(401, "Video was not added!");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                addedVideo,
                "Video was successfully added to the playlist!"
            )
        );
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "Something went wrong while adding the video to the playlist!"
        );
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Playlist ID or Video ID is not valid!");
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(402, "Playlist not found!");
        }

        if (!req.user?._id || !playlist.owner.equals(req.user._id)) {
            throw new ApiError(403, "You are not allowed to modify this playlist!");
        }

        const videoExists = playlist.videos.some((video) => video.toString() === videoId);

        if (!videoExists) {
            throw new ApiError(401, "Video does not exist in the playlist!");
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true }
        );

        if (!updatedPlaylist) {
            throw new ApiError(500, "Failed to remove the video from the playlist!");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video was successfully removed from the playlist!"
            )
        );
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "Something went wrong while removing the video from the playlist!"
        );
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "playlistId was not valid!!")
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(401, "Playlist was not found!!")
        }

        if (!playlist.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthorized!! You are not allowed to delete!!")
        }

        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

        if (!deletedPlaylist) {
            throw new ApiError(401, "Playlist was not found!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Playlist was successfully deleted!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while fetching playlist!!")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "PlaylistId is not valid!!")
    }

    if (!name || !description) {
        throw new ApiError(401, "All Fields are required!!")
    }

    try {
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(401, "Playlists were not found!")
        }

        if (!playlist.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthoirized!! You are not allowed to update!!")
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
            },
            {
                new: true
            }
        )

        if (!updatedPlaylist) {
            throw new ApiError(401, "Playlist was not updated!!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "Playlist was successfully updated!!"
                )
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "Somthing went wrong while updating the playlist!!")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
