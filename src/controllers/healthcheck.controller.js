import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (_, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, {}, "Ok"))
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong!!")
    }
})

export {
    healthcheck
}
