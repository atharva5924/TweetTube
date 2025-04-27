import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/User.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getSubscribedChannelsAggregation = async (subscriberId) => {
  const pipeline = [
    {
      $match: {
        subscriber: subscriberId,
      },
    },
    {
      $project: {
        _id: 0,
        channel: 1,
      },
    },
    {
      $group: {
        _id: "channels",
        subscribedChannels: {
          $push: "$channel",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribedChannels",
        foreignField: "_id",
        as: "subscribedChannels",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
              avatar: 1,
              userName: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        subscribedChannels: 1,
      },
    },
  ];

  return Subscription.aggregate(pipeline);
};

const toggleSubscription = asyncHandler(async (req, res, next) => {
  //TODO: toggle subscription
  const { channelId } = req.params;

  if (!channelId) {
    return next(new ApiError(400, `channeId is missing`));
  }

  if (!isValidObjectId(channelId)) {
    return next(new ApiError(400, `${channelId} is not a valid channel id`));
  }

  // handle the case when the channel Id is correctly formatted but doesn't exist in DB
  const channel = await User.findById(channelId);

  if (!channel) {
    return next(
      new ApiError(400, `channel Id ${channelId} is not available in DB`)
    );
  }

  const subscriberId = req.user._id;

  // check if user is already subscribed,
  // check using both channel and subscriber fields otherwise other channel subscription might get deleted
  //as single user can subscribe to multiple channels
  const isSubscribed = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  //   console.log("Already subscribed user: ", isSubscribed);

  if (isSubscribed) {
    // remove subscription
    await Subscription.findByIdAndDelete(isSubscribed._id);

    const subscriptionsList =
      await getSubscribedChannelsAggregation(subscriberId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriptionsList[0].subscribedChannels,
          "Subscription removed successfully"
        )
      );
  }

  const subscriptionAdded = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (!subscriptionAdded) {
    return next(
      new ApiError(400, `something went wrong while adding your subscription`)
    );
  }

  //   console.log("Subscription details: \n", subscriptionAdded);

  const subscriptionsList =
    await getSubscribedChannelsAggregation(subscriberId);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptionsList[0].subscribedChannels,
        "Subscription added successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    return next(new ApiError(400, `channeId is missing`));
  }

  if (!isValidObjectId(channelId)) {
    return next(new ApiError(400, `${channelId} is not a valid channel id`));
  }

  // handle the case when the channel Id is correctly formatted  but doesn't exist in DB
  const channel = await User.findById(channelId);

  if (!channel) {
    return next(
      new ApiError(400, `channel Id ${channelId} is not available in DB`)
    );
  }

  const pipeline = [
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "$channel",
        subscribersArray: {
          $push: "$subscriber",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribersArray",
        foreignField: "_id",
        as: "subscribersList",
        pipeline: [
          {
            $project: {
              _id: 0,
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$subscribersArray",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribersList: 1,
        totalSubscribers: 1,
      },
    },
  ];

  const subscribers = await Subscription.aggregate(pipeline);

  // console.log("Subscribers list fetched from the DB: \n", subscribers);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers: subscribers[0]?.subscribersList || [],
        totalSubscribers: subscribers[0]?.totalSubscribers || 0,
      },
      "channel subscribers fetched successfully"
    )
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    return next(new ApiError(400, "Subscriber Id is missing"));
  }

  if (!isValidObjectId(subscriberId)) {
    return next(new ApiError(400, "Invlaid  Subscriber ID"));
  }

  const subscriber = await User.findById(subscriberId);

  if (!subscriber) {
    return next(new ApiError(400, "Subscriber doesn't exist in DB"));
  }

  const pipeline = [
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $group: {
        _id: "$subscriber",
        subscribedArray: {
          $push: "$channel",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribedArray",
        foreignField: "_id",
        as: "subscribedChannelList",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
              avatar: 1,
              userName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubscribedChannels: {
          $size: "$subscribedArray",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribedChannelList: 1,
        totalSubscribedChannels: 1,
      },
    },
  ];

  const subscribedChannels = await Subscription.aggregate(pipeline);

  // console.log("subscribed channels list \n", subscribedChannels);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribedChannels: subscribedChannels[0]?.subscribedChannelList || [],
        totalSubscribedChannels:
          subscribedChannels[0]?.totalSubscribedChannels || 0,
      },
      "Subscribed channels fetched successfully"
    )
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
