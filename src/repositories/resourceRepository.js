import Resource from "../models/Resource.js";

const POPULATE = [{ path: "createdBy", select: "name avatarUrl role" }];

export const create = (data) => Resource.create(data);

export const findAll = (
  filter = {},
  { limit = 20, skip = 0, sort = { createdAt: -1 } } = {}
) => Resource.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit);

export const countAll = (filter = {}) => Resource.countDocuments(filter);

export const findById = (id) => Resource.findById(id).populate(POPULATE);
