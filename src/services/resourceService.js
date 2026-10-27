import * as resourceRepo from "../repositories/resourceRepository.js";
import { normalizeCategory } from "../config/constants.js";
import { RESOURCE_TYPES } from "../models/Resource.js";
import { httpError } from "../utils/httpError.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serialize = (doc) => {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    _id: r._id,
    title: r.title,
    description: r.description || "",
    category: r.category,
    type: r.type,
    url: r.url || "",
    phone: r.phone || "",
    district: r.district || "",
    address: r.address || "",
    createdBy:
      r.createdBy && r.createdBy._id
        ? { _id: r.createdBy._id, name: r.createdBy.name, role: r.createdBy.role }
        : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

export const listResources = async (query = {}) => {
  const filter = {};
  if (query.category && query.category !== "all") filter.category = normalizeCategory(query.category);
  if (query.type && query.type !== "all") filter.type = String(query.type);
  if (query.district) filter.district = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  if (query.q) filter.title = new RegExp(escapeRegex(query.q).slice(0, 100), "i");

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    resourceRepo.findAll(filter, { limit, skip: (page - 1) * limit }),
    resourceRepo.countAll(filter),
  ]);

  return { items: items.map(serialize), total, page, limit };
};

export const getResource = async (id) => {
  const resource = await resourceRepo.findById(id);
  return resource ? serialize(resource) : null;
};

export const createResource = async (payload, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const title = String(payload.title || "").trim();
  if (!title) throw httpError(400, "Resource title is required");

  const created = await resourceRepo.create({
    title,
    description: payload.description ? String(payload.description).trim() : "",
    category: normalizeCategory(payload.category),
    type: RESOURCE_TYPES.includes(payload.type) ? payload.type : "link",
    url: payload.url ? String(payload.url).trim() : "",
    phone: payload.phone ? String(payload.phone).trim() : "",
    district: payload.district ? String(payload.district).trim() : "",
    address: payload.address ? String(payload.address).trim() : "",
    createdBy: user._id,
  });

  return serialize(await resourceRepo.findById(created._id));
};
