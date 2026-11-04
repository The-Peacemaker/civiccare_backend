import * as communityRepo from "../repositories/communityRepository.js";
import * as memberRepo from "../repositories/communityMemberRepository.js";
import { deleteByCommunity } from "./notificationService.js";
import {
  STAFF_ROLES,
  communityCategoryLabel,
  normalizeCommunityCategory,
  normalizeVisibility,
} from "../config/constants.js";
import { formatDate } from "../utils/time.js";
import { httpError } from "../utils/httpError.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const initials = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const serialize = (doc, userId, memberships = []) => {
  const c = doc.toObject ? doc.toObject() : doc;
  const people = memberships.map((m) => {
    const user = m.user && m.user._id ? m.user : { _id: m.user };
    return {
      id: String(user._id),
      name: user.name || "Member",
      avatarUrl: user.avatarUrl || "",
      initials: initials(user.name || "M"),
      role: m.role === "admin" ? "Admin" : "Member",
      joinedAt: m.joinedAt,
      joined: formatDate(m.joinedAt),
    };
  });
  const joined = userId ? people.some((p) => String(p.id) === String(userId)) : false;

  return {
    id: String(c._id),
    _id: c._id,
    name: c.name,
    description: c.description || "",
    category: c.category,
    categoryLabel: communityCategoryLabel(c.category),
    visibility: c.visibility,
    visibilityLabel: c.visibility === "private" ? "Private" : "Public",
    isPrivate: c.visibility === "private",
    location: c.location || c.district || "",
    district: c.district || "",
    avatarUrl: c.avatarUrl || "",
    icon: c.icon || "",
    cover: c.cover || "",
    memberCount: c.memberCount ?? people.length,
    // Feed cards expect `members` to be a number.
    members: c.memberCount ?? people.length,
    memberList: people,
    memberPreviews: people.slice(0, 4).map((p) => p.initials),
    people,
    postCount: c.postCount || 0,
    createdBy:
      c.createdBy && c.createdBy._id
        ? { _id: c.createdBy._id, name: c.createdBy.name, avatarUrl: c.createdBy.avatarUrl || "" }
        : null,
    joined,
    initiallyJoined: joined,
    createdAt: c.createdAt,
    createdLabel: formatDate(c.createdAt),
    updatedAt: c.updatedAt,
  };
};

export const listCommunities = async (query = {}, currentUser) => {
  const filter = {};
  if (query.category && query.category !== "all") {
    filter.category = normalizeCommunityCategory(query.category);
  }
  if (query.visibility && ["public", "private"].includes(String(query.visibility).toLowerCase())) {
    filter.visibility = String(query.visibility).toLowerCase();
  }
  if (query.district) filter.district = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  if (query.q) filter.name = new RegExp(escapeRegex(query.q).slice(0, 100), "i");

  // Private communities are only visible to members and staff.
  if (currentUser && STAFF_ROLES.includes(currentUser.role)) {
    // staff can see everything
  } else if (currentUser) {
    filter.$or = [{ visibility: "public" }, { members: currentUser._id }];
  } else {
    filter.visibility = "public";
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    communityRepo.findAll(filter, { limit, skip: (page - 1) * limit }),
    communityRepo.countAll(filter),
  ]);

  const memberships = await memberRepo.listForCommunities(items.map((c) => c._id));
  const grouped = new Map();
  for (const membership of memberships) {
    const key = String(membership.community);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(membership);
  }

  return {
    items: items.map((c) => serialize(c, currentUser?._id, grouped.get(String(c._id)) || [])),
    total,
    page,
    limit,
  };
};

export const getCommunity = async (id, currentUser) => {
  const community = await communityRepo.findById(id);
  if (!community) return null;

  const memberships = await memberRepo.listForCommunity(id);
  const isMember = memberships.some((m) => String(m.user?._id || m.user) === String(currentUser?._id));
  const canSee =
    community.visibility !== "private" ||
    isMember ||
    (currentUser && STAFF_ROLES.includes(currentUser.role));
  if (!canSee) return null;

  return serialize(community, currentUser?._id, memberships);
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
    category: normalizeCommunityCategory(payload.category),
    visibility: normalizeVisibility(payload.visibility, payload.isPrivate === true),
    location: payload.location ? String(payload.location).trim() : "",
    district: payload.district ? String(payload.district).trim() : "",
    avatarUrl: payload.avatarUrl ? String(payload.avatarUrl).trim() : "",
    icon: payload.icon ? String(payload.icon).trim() : "",
    cover: payload.cover ? String(payload.cover).trim() : "",
    createdBy: user._id,
    members: [user._id],
    memberCount: 1,
  });

  await memberRepo.add(created._id, user._id, "admin");
  const memberships = await memberRepo.listForCommunity(created._id);
  return serialize(await communityRepo.findById(created._id), user._id, memberships);
};

export const toggleMembership = async (id, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const community = await communityRepo.findById(id);
  if (!community) return null;

  const existing = await memberRepo.findOne(id, user._id);
  if (existing) {
    await memberRepo.remove(id, user._id);
    await communityRepo.removeMember(id, user._id);
  } else {
    await memberRepo.add(id, user._id, "member");
    await communityRepo.addMember(id, user._id);
  }

  const memberCount = await memberRepo.countByCommunity(id);
  await communityRepo.updateById(id, { memberCount });
  const fresh = await communityRepo.findById(id);
  const memberships = await memberRepo.listForCommunity(id);
  return { community: serialize(fresh, user._id, memberships), joined: !existing };
};

export const updateCommunity = async (id, payload, user) => {
  if (!user) throw httpError(401, "Authentication required");
  const community = await communityRepo.findById(id);
  if (!community) return null;

  const isCreator = String(community.createdBy?._id || community.createdBy) === String(user._id);
  if (!isCreator && !STAFF_ROLES.includes(user.role)) {
    throw httpError(403, "Only the community owner or staff can edit this community");
  }

  const data = {};
  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    const duplicate = await communityRepo.findOneByName(name);
    if (duplicate && String(duplicate._id) !== String(id)) {
      throw httpError(409, "Community name already exists");
    }
    data.name = name;
  }
  if (payload.description !== undefined) data.description = String(payload.description).trim();
  if (payload.category !== undefined) data.category = normalizeCommunityCategory(payload.category);
  if (payload.visibility !== undefined || payload.isPrivate !== undefined) {
    data.visibility = normalizeVisibility(payload.visibility, payload.isPrivate === true);
  }
  if (payload.location !== undefined) data.location = String(payload.location).trim();
  if (payload.district !== undefined) data.district = String(payload.district).trim();
  if (payload.avatarUrl !== undefined) data.avatarUrl = String(payload.avatarUrl).trim();
  if (payload.icon !== undefined) data.icon = String(payload.icon).trim();
  if (payload.cover !== undefined) data.cover = String(payload.cover).trim();

  const updated = await communityRepo.updateById(id, data);
  const memberships = await memberRepo.listForCommunity(id);
  return serialize(updated, user._id, memberships);
};

export const deleteCommunity = async (id, user) => {
  if (!user) throw httpError(401, "Authentication required");
  const community = await communityRepo.findById(id);
  if (!community) return null;

  const isCreator = String(community.createdBy?._id || community.createdBy) === String(user._id);
  if (!isCreator && !STAFF_ROLES.includes(user.role)) {
    throw httpError(403, "Only the community owner or staff can delete this community");
  }

  await memberRepo.listForCommunity(id).then((members) =>
    Promise.all(members.map((m) => memberRepo.remove(id, m.user?._id || m.user)))
  );
  await communityRepo.deleteById(id);
  await deleteByCommunity(id);
  return { _id: id, name: community.name };
};
