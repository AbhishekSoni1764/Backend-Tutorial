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
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
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
