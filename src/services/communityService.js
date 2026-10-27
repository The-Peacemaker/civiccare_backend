import * as communityRepo from "../repositories/communityRepository.js";
import { normalizeCategory } from "../config/constants.js";
import { httpError } from "../utils/httpError.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serialize = (doc, userId) => {
  const c = doc.toObject ? doc.toObject() : doc;
  const members = (c.members || []).map((m) => (m && m._id ? m : { _id: m }));

  return {
    _id: c._id,
    name: c.name,
    description: c.description || "",
    category: c.category,
    visibility: c.visibility,
    district: c.district || "",
    avatarUrl: c.avatarUrl || "",
    memberCount: c.memberCount ?? members.length,
    postCount: c.postCount || 0,
    members: members.slice(0, 5).map((m) => ({
      _id: m._id,
      name: m.name || "Member",
      avatarUrl: m.avatarUrl || "",
    })),
    createdBy:
      c.createdBy && c.createdBy._id
        ? { _id: c.createdBy._id, name: c.createdBy.name, avatarUrl: c.createdBy.avatarUrl || "" }
        : null,
    joined: userId
      ? members.some((m) => String(m._id) === String(userId))
      : false,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

export const listCommunities = async (query = {}, currentUser) => {
  const filter = {};
  if (query.category && query.category !== "all") filter.category = normalizeCategory(query.category);
  if (query.district) filter.district = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  if (query.q) filter.name = new RegExp(escapeRegex(query.q).slice(0, 100), "i");

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    communityRepo.findAll(filter, { limit, skip: (page - 1) * limit }),
    communityRepo.countAll(filter),
  ]);

  return {
    items: items.map((c) => serialize(c, currentUser?._id)),
    total,
    page,
    limit,
  };
};

export const getCommunity = async (id, currentUser) => {
  const community = await communityRepo.findById(id);
  return community ? serialize(community, currentUser?._id) : null;
};

export const createCommunity = async (payload, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const name = String(payload.name || "").trim();
  if (!name) throw httpError(400, "Community name is required");

  const exists = await communityRepo.findOneByName(name);
  if (exists) throw httpError(409, "Community name already exists");

  const created = await communityRepo.create({
    name,
    description: payload.description ? String(payload.description).trim() : "",
    category: normalizeCategory(payload.category),
    visibility: payload.visibility === "private" ? "private" : "public",
    district: payload.district ? String(payload.district).trim() : "",
    avatarUrl: payload.avatarUrl ? String(payload.avatarUrl).trim() : "",
    createdBy: user._id,
    members: [user._id],
    memberCount: 1,
  });

  return serialize(await communityRepo.findById(created._id), user._id);
};

export const toggleMembership = async (id, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const community = await communityRepo.findById(id);
  if (!community) return null;

  const isMember = (community.members || []).some((m) => String(m._id || m) === String(user._id));
  if (isMember) await communityRepo.removeMember(id, user._id);
  else await communityRepo.addMember(id, user._id);

  const fresh = await communityRepo.findById(id);
  return { community: serialize(fresh, user._id), joined: !isMember };
};
