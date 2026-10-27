import mongoose from "mongoose";
import * as resourceService from "../services/resourceService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const invalidId = (res) =>
  res.status(400).json({ success: false, message: "Invalid resource id" });

export const list = async (req, res, next) => {
  try {
    const result = await resourceService.listResources(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const data = await resourceService.getResource(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Resource not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await resourceService.createResource(req.body, req.user);
    res.status(201).json({ success: true, message: "Resource created", data });
  } catch (err) {
    next(err);
  }
};
