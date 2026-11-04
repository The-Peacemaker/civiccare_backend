import User from "../models/User.js";
import { toPublicUser, toSelfUser } from "../serializers/userSerializer.js";
import { httpError } from "../utils/httpError.js";

export const getMe = async (id) => {
  const user = await User.findById(id);
  return user ? toSelfUser(user) : null;
};

export const updateMe = async (id, payload = {}) => {
  const data = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw httpError(400, "Name cannot be empty");
    data.name = name;
  }
  if (payload.avatarUrl !== undefined) {
    data.avatarUrl = String(payload.avatarUrl || "").trim();
  }
  if (payload.anonymousHandle !== undefined) {
    const handle = String(payload.anonymousHandle).trim();
    if (!handle) throw httpError(400, "Anonymous handle cannot be empty");
    if (handle.length > 50) throw httpError(400, "Anonymous handle cannot exceed 50 characters");
    const taken = await User.exists({ anonymousHandle: handle, _id: { $ne: id } });
    if (taken) throw httpError(409, "Anonymous handle already in use");
    data.anonymousHandle = handle;
  }

  const user = await User.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
  return user ? toSelfUser(user) : null;
};

export const getPublicUser = async (id) => {
  const user = await User.findById(id);
  return user ? toPublicUser(user) : null;
};
