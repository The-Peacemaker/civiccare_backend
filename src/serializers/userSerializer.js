import { STAFF_ROLES } from "../config/constants.js";

export const toPublicUser = (user) => {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id: String(u._id),
    _id: u._id,
    name: u.name,
    avatarUrl: u.avatarUrl || "",
    role: u.role,
    isGuest: Boolean(u.isGuest),
    anonymousHandle: u.anonymousHandle || "",
    createdAt: u.createdAt,
  };
};

export const toSelfUser = (user) => {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    ...toPublicUser(u),
    email: u.email || null,
    authProvider: u.authProvider,
    isStaff: STAFF_ROLES.includes(u.role),
    isAdmin: u.role === "admin",
  };
};
