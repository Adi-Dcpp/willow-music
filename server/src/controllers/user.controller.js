import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js"
import { User } from "../models/user.model.js"

const getCurrentUser = asyncHandler(async(req, res) => {
    const { userId } = req.user;

    const user = await User.findById(userId).select("spotifyUserId displayName profileImage")

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    return res  
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User data fetched successfully",
                {
                    spotifyUserId : user.spotifyUserId,
                    displayName : user.displayName,
                    profileImage : user.profileImage
                }
            )
        )
})

export {
    getCurrentUser
}