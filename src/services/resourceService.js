import * as resourceRepo from "../repositories/resourceRepository.js";
import { STAFF_ROLES, categoryLabel, normalizeCategory } from "../config/constants.js";
import { RESOURCE_TYPES } from "../models/Resource.js";
import { httpError } from "../utils/httpError.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TYPE_LABELS = {
  guide: "Guide",
  contact: "Contact",
  service: "Service",
  link: "Link",
  document: "Document",
};

const serialize = (doc) => {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(r._id),
    _id: r._id,
    title: r.title,
    description: r.description || "",
    category: r.category,
    categoryLabel: categoryLabel(r.category),
    type: r.type,
    typeLabel: TYPE_LABELS[r.type] || "Link",
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

  return { items: items.map(serialize), data: items.map(serialize), total, page, limit };
};

export const getResource = async (id) => {
  const resource = await resourceRepo.findById(id);
  return resource ? serialize(resource) : null;
};

const buildData = (payload) => {
  const data = {};
  if (payload.title !== undefined) data.title = String(payload.title).trim();
  if (payload.description !== undefined) data.description = String(payload.description).trim();
  if (payload.category !== undefined) data.category = normalizeCategory(payload.category);
  if (payload.type !== undefined) {
    data.type = RESOURCE_TYPES.includes(payload.type) ? payload.type : "link";
  }
  if (payload.url !== undefined) data.url = String(payload.url).trim();
  if (payload.phone !== undefined) data.phone = String(payload.phone).trim();
  if (payload.district !== undefined) data.district = String(payload.district).trim();
  if (payload.address !== undefined) data.address = String(payload.address).trim();
  return data;
};

export const createResource = async (payload, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const title = String(payload.title || "").trim();
  if (!title) throw httpError(400, "Resource title is required");

  const created = await resourceRepo.create({
    ...buildData(payload),
    title,
    createdBy: user._id,
  });

  return serialize(await resourceRepo.findById(created._id));
};

export const updateResource = async (id, payload, user) => {
  if (!user) throw httpError(401, "Authentication required");
  const resource = await resourceRepo.findById(id);
  if (!resource) return null;

  const isCreator = String(resource.createdBy?._id || resource.createdBy) === String(user._id);
  if (!isCreator && !STAFF_ROLES.includes(user.role)) {
    throw httpError(403, "Only the resource owner or staff can edit this resource");
  }

  const updated = await resourceRepo.updateById(id, buildData(payload));
  return updated ? serialize(updated) : null;
};

export const deleteResource = async (id, user) => {
  if (!user) throw httpError(401, "Authentication required");
  const resource = await resourceRepo.findById(id);
  if (!resource) return null;

  const isCreator = String(resource.createdBy?._id || resource.createdBy) === String(user._id);
  if (!isCreator && !STAFF_ROLES.includes(user.role)) {
    throw httpError(403, "Only the resource owner or staff can delete this resource");
  }

  await resourceRepo.deleteById(id);
  return { _id: id, title: resource.title };
};
