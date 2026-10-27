import Community from "../models/Community.js";

const POPULATE = [
  { path: "createdBy", select: "name avatarUrl role" },
  { path: "members", select: "name avatarUrl" },
];

export const create = (data) => Community.create(data);

export const findAll = (
  filter = {},
  { limit = 20, skip = 0, sort = { createdAt: -1 } } = {}
) => Community.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit);

export const countAll = (filter = {}) => Community.countDocuments(filter);

export const findById = (id) => Community.findById(id).populate(POPULATE);

export const findOneByName = (name) =>
  Community.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });

export const addMember = (id, userId) =>
  Community.findByIdAndUpdate(
    id,
    { $addToSet: { members: userId }, $inc: { memberCount: 1 } },
    { returnDocument: "after" }
  ).populate(POPULATE);

export const removeMember = (id, userId) =>
  Community.findByIdAndUpdate(
    id,
    { $pull: { members: userId }, $inc: { memberCount: -1 } },
    { returnDocument: "after" }
  ).populate(POPULATE);
