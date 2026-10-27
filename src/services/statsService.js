import * as complaintRepo from "../repositories/complaintRepository.js";
import { normalizeCategory, normalizeStatus } from "../config/constants.js";

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

  return {
    total,
    pending: statusCount("pending"),
    inProgress: statusCount("in-progress"),
    resolved,
    rejected: statusCount("rejected"),
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    activeDistricts: activeDistricts.filter(Boolean).length,
    byStatus,
    byCategory,
    byPriority,
    byDistrict: districts.map((d) => ({ district: d._id, total: d.total })),
  };
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
    _id: c._id,
    title: c.title,
    category: c.category,
    status: c.status,
    priority: c.priority,
    district: c.location?.district || "",
    locationText: c.location?.text || "",
    coords: { lat: c.location?.latitude ?? null, lng: c.location?.longitude ?? null },
    upvoteCount: c.upvoteCount || 0,
    isAnonymous: Boolean(c.isAnonymous || c.author?.isGuest),
    createdAt: c.createdAt,
  }));
};
