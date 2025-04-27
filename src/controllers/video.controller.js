import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/User.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const {
    sortBy = "createdAt",
    limit = 100,
    page = 1,
    sortType = -1,
  } = req.query;
  // console.table([page, limit, query, sortBy, sortType, userId]);

  const pipeline = [
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$ownerDetails", 0] },
      },
    },
    {
      $sort: {
        [sortBy]: parseInt(sortType),
      },
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ].filter(Boolean);

  const videos = await Video.aggregate(pipeline);

  const totalVideos = await Video.countDocuments({ isPublished: true });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalVideos / parseInt(limit)),
        totalVideos,
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  let playlistIds = [];
  playlistIds = JSON.parse(req.body.playlistIds || "[]");

  if (!title) {
    return next(new ApiError(400, "title cannot be empty"));
  }

  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    return next(
      new ApiError(400, "Please select a video and a thumbnail image to upload")
    );
  }

  const videoLocalPath = req?.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video) {
    return next(
      new ApiError(500, "something went wrong while uploading video")
    );
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    return next(
      new ApiError(500, "something went wrong while uploading thumbnail")
    );
  }

  const isPublished = visibility === "public" ? true : false;

  // create a Video document and save in DB
  const videoDoc = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    duration: video.duration,
    owner: req.user._id,
    isPublished,
  });

  if (!videoDoc) {
    return next(
      new ApiError(500, "something went wrong while saving video in database")
    );
  }

  // Handle adding the video to playlists
  if (Array.isArray(playlistIds) && playlistIds.length > 0) {
    for (const playlistId of playlistIds) {
      console.log(`Adding video to playlist ${playlistId}`);

      await addVideoToPlaylistUtility(videoDoc._id, playlistId, req);
    }
  }

  res
    .status(201)
    .json(new ApiResponse(200, videoDoc, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    return next(new ApiError(400, "video id is missing."));
  }

  if (!isValidObjectId(videoId)) {
    return next(new ApiError(400, "invalid video id"));
  }

  let video = await Video.updateOne(
    { _id: new mongoose.Types.ObjectId(videoId) },
    { $inc: { views: 1 } }
  );

  if (!video) {
    return next(new ApiError(500, `video with id ${videoId} does not exist`));
  }

  // pipeline
  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner._id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
        subscribers: {
          $size: "$subscribers",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ];

  video = await Video.aggregate(pipeline);

  // check if the videoId already exists in the watchHistory of the user
  const currentWatchHistory = req.user.watchHistory;
  // console.log({ currentWatchHistory });

  const index = currentWatchHistory?.findIndex(
    (history) => history.toString() === videoId
  );
  if (index > -1) {
    currentWatchHistory?.splice(index, 1);
  }

  currentWatchHistory?.unshift(videoId);

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        watchHistory: currentWatchHistory,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    return next(
      new ApiError(
        500,
        "something went wrong while updating users watch history"
      )
    );
  }

  // console.log("watch history updated user: \n", updatedUser.watchHistory);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video[0],
        `video with id ${videoId} fetched successfully`
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    return next(new ApiError(400, "video id is missing."));
  }

  if (!isValidObjectId(videoId)) {
    return next(new ApiError(400, "invalid video id"));
  }

  const { title, description, visibility } = req.body;

  let playlistIds = [];
  playlistIds = JSON.parse(req.body.playlistIds || "[]");

  // get local path of thumbnail, get old thumbnail public id for deletion
  let thumbnailLocalPath, newThumbnail, oldThumbnail;

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $project: {
        _id: 0,
        thumbnail: 1,
      },
    },
  ];

  oldThumbnail = await Video.aggregate(pipeline);

  if (req.file) {
    thumbnailLocalPath = req.file?.path;
    console.log("222 ", thumbnailLocalPath);
    newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!newThumbnail) {
      return next(
        new ApiError(500, "something went wrong while uploading thumbnail")
      );
    }

    // delete old thumbnail from cloudinary
    console.log("529", oldThumbnail[0].thumbnail);
    await deleteFromCloudinary(
      oldThumbnail[0].thumbnail.split("/").pop().split(".")[0]
    );
  }

  if (Array.isArray(playlistIds) && playlistIds.length > 0) {
    for (const playlistId of playlistIds) {
      console.log(`Adding video to playlist ${playlistId}`);

      await addVideoToPlaylistUtility(videoId, playlistId, req);
    }
  }

  const isPublished = visibility === "public" ? true : false;

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail?.url,
        isPublished,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    return next(new ApiError(500, `video with id ${videoId} does not exist`));
  }

  console.log(updatedVideo);

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    return next(new ApiError(400, "video id is missing."));
  }

  if (!isValidObjectId(videoId)) {
    return next(new ApiError(400, "invalid video id"));
  }

  // if the video with provided id is deleted then return error
  let video = await Video.findById(videoId);

  if (!video) {
    return next(
      new ApiError(400, `video with id ${videoId} is already deleted`)
    );
  }

  // console.log(req.user._id.toString() === video.owner.toString());

  // check if the user has the authority to delete the video
  if (req.user._id.toString() !== video.owner.toString()) {
    return next(
      new ApiError(
        401,
        "You do not have permission to perform this action on this resource"
      )
    );
  }
  // delete video and thumbnail from cloudinary before deleting the document from DB
  const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

  await deleteFromCloudinary(videoPublicId);
  await deleteFromCloudinary(thumbnailPublicId);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    return next(new ApiError(500, `video with id ${videoId} does not exist`));
  }

  // console.log("Deleted video data: \n", deletedVideo);

  res.status(200).json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    return next(new ApiError(400, "video id is missing."));
  }

  if (!isValidObjectId(videoId)) {
    return next(new ApiError(400, "invalid video id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return next(
      new ApiError(400, `video with id ${videoId} doesn't exist in DB.`)
    );
  }

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video publish status updated!"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
