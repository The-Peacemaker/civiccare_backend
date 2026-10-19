import Complaint from "../models/Complaint.js";

// Only this layer talks to Mongoose for complaints.
const POPULATE = [
  { path: "author", select: "name email avatarUrl role isGuest anonymousHandle authProvider" },
  { path: "assignedTo", select: "name email" },
];

export const create = (data) => Complaint.create(data);

export const findAll = (filter = {}, { limit = 20, skip = 0, sort = { createdAt: -1 } } = {}) =>
  Complaint.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit);

export const countAll = (filter = {}) => Complaint.countDocuments(filter);

export const findById = (id) => Complaint.findById(id).populate(POPULATE);

export const updateById = (id, data) =>
  Complaint.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).populate(
    POPULATE
  );

export const deleteById = (id) => Complaint.findByIdAndDelete(id);

export const incrementCounter = (id, field, amount) =>
  Complaint.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { returnDocument: "after" });

export const findManyByIds = (ids) => Complaint.find({ _id: { $in: ids } }).populate(POPULATE);

// Raw documents (no populate) for stats aggregations.
export const aggregate = (pipeline) => Complaint.aggregate(pipeline);

export const distinctDistricts = () => Complaint.distinct("location.district");
