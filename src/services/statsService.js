import * as complaintRepo from "../repositories/complaintRepository.js";
import {
  categoryLabel,
  normalizeCategory,
  normalizeStatus,
  priorityLabel,
  statusLabel,
} from "../config/constants.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const groupCount = (field) =>
  complaintRepo
    .aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .then((rows) => rows.map((r) => ({ key: r._id || "unknown", count: r.count })));

export const getOverview = async () => {
  const [total, resolved, byStatus, byCategory, byPriority, districts, activeDistricts] =
    await Promise.all([
      complaintRepo.countAll({}),
      complaintRepo.countAll({ status: "resolved" }),
      groupCount("status"),
      groupCount("category"),
      groupCount("priority"),
      complaintRepo.aggregate([
        { $match: { "location.district": { $nin: ["", null] } } },
        { $group: { _id: "$location.district", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      complaintRepo.distinctDistricts(),
    ]);

  const statusCount = (key) => byStatus.find((s) => s.key === key)?.count || 0;

  const engagement = await getEngagementTotals();

  return {
    total,
    totalPosts: total,
    pending: statusCount("pending"),
    openReports: statusCount("pending") + statusCount("in-progress"),
    inProgress: statusCount("in-progress"),
    resolved,
    postsResolved: resolved,
    rejected: statusCount("rejected"),
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    activeDistricts: activeDistricts.filter(Boolean).length,
    activeEngagement: engagement.total,
    engagement,
    byStatus: byStatus.map((s) => ({ ...s, label: statusLabel(s.key) })),
    byCategory: byCategory.map((c) => ({ ...c, label: categoryLabel(c.key) })),
    byPriority: byPriority.map((p) => ({ ...p, label: priorityLabel(p.key) })),
    byDistrict: districts.map((d) => ({ district: d._id, total: d.total })),
  };
};

const getEngagementTotals = async () => {
  const [row] = await complaintRepo.aggregate([
    {
      $group: {
        _id: null,
        likes: { $sum: "$upvoteCount" },
        comments: { $sum: "$commentCount" },
        shares: { $sum: "$shareCount" },
      },
    },
  ]);
  const likes = row?.likes || 0;
  const comments = row?.comments || 0;
  const shares = row?.shares || 0;
  return { likes, comments, shares, total: likes + comments + shares };
};

export const getEngagement = async (query = {}) => {
  const totals = await getEngagementTotals();
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 5, 1), 20);
  const top = await complaintRepo.findAll(
    {},
    { limit, sort: { upvoteCount: -1, commentCount: -1, createdAt: -1 } }
  );

  return {
    ...totals,
    topPosts: top.map((c) => ({
      id: String(c._id),
      title: c.title,
      category: c.category,
      categoryLabel: categoryLabel(c.category),
      likes: c.upvoteCount || 0,
      comments: c.commentCount || 0,
      shares: c.shareCount || 0,
      total: (c.upvoteCount || 0) + (c.commentCount || 0) + (c.shareCount || 0),
    })),
  };
};

export const getDistricts = async () => {
  const rows = await complaintRepo.aggregate([
    { $match: { "location.district": { $nin: ["", null] } } },
    {
      $group: {
        _id: "$location.district",
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        lat: { $avg: "$location.latitude" },
        lng: { $avg: "$location.longitude" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map((r) => ({
    district: r._id,
    total: r.total,
    resolved: r.resolved,
    lat: Number.isFinite(r.lat) ? Number(r.lat.toFixed(5)) : null,
    lng: Number.isFinite(r.lng) ? Number(r.lng.toFixed(5)) : null,
    coords:
      Number.isFinite(r.lat) && Number.isFinite(r.lng)
        ? { lat: Number(r.lat.toFixed(5)), lng: Number(r.lng.toFixed(5)) }
        : null,
  }));
};

export const getMapPins = async (query = {}) => {
  const filter = {
    "location.latitude": { $ne: null },
    "location.longitude": { $ne: null },
  };
  if (query.status && query.status !== "all") filter.status = normalizeStatus(query.status);
  if (query.category && query.category !== "all") filter.category = normalizeCategory(query.category);
  if (query.district) {
    filter["location.district"] = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 500, 1), 1000);
  const items = await complaintRepo.findAll(filter, { limit, sort: { createdAt: -1 } });

  return items.map((c) => ({
    id: String(c._id),
    _id: c._id,
    title: c.title,
    category: c.category,
    categoryLabel: categoryLabel(c.category),
    status: c.status,
    statusLabel: statusLabel(c.status),
    priority: c.priority,
    priorityLabel: priorityLabel(c.priority),
    district: c.location?.district || "",
    location: c.location?.text || "",
    locationText: c.location?.text || "",
    coords: { lat: c.location?.latitude ?? null, lng: c.location?.longitude ?? null },
    upvoteCount: c.upvoteCount || 0,
    commentCount: c.commentCount || 0,
    shareCount: c.shareCount || 0,
    likes: c.upvoteCount || 0,
    comments: c.commentCount || 0,
    shares: c.shareCount || 0,
    author: c.isAnonymous || c.author?.isGuest
      ? c.author?.anonymousHandle || "Anonymous User"
      : c.author?.name || "Anonymous User",
    isAnonymous: Boolean(c.isAnonymous || c.author?.isGuest),
    createdAt: c.createdAt,
  }));
};
