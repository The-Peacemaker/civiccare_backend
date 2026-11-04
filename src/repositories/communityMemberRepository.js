import CommunityMember from "../models/CommunityMember.js";

const USER_POPULATE = { path: "user", select: "name avatarUrl role" };

export const add = (community, user, role = "member") =>
  CommunityMember.findOneAndUpdate(
    { community, user },
    { $setOnInsert: { community, user, role, joinedAt: new Date() } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).populate(USER_POPULATE);

export const remove = (community, user) =>
  CommunityMember.findOneAndDelete({ community, user });

export const findOne = (community, user) => CommunityMember.findOne({ community, user });

export const listForCommunity = (communityId) =>
  CommunityMember.find({ community: communityId })
    .populate(USER_POPULATE)
    .sort({ joinedAt: 1 });

export const listForCommunities = (communityIds) =>
  CommunityMember.find({ community: { $in: communityIds } }).populate(USER_POPULATE);

export const countByCommunity = (communityId) =>
  CommunityMember.countDocuments({ community: communityId });
