import mongoose from "mongoose";
import * as communityService from "../services/communityService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const invalidId = (res) =>
  res.status(400).json({ success: false, message: "Invalid community id" });

export const list = async (req, res, next) => {
  try {
    const result = await communityService.listCommunities(req.query, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const data = await communityService.getCommunity(req.params.id, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Community not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await communityService.createCommunity(req.body, req.user);
    res.status(201).json({ success: true, message: "Community created", data });
  } catch (err) {
    next(err);
  }
};

export const join = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const result = await communityService.toggleMembership(req.params.id, req.user);
    if (!result) return res.status(404).json({ success: false, message: "Community not found" });
    res.status(200).json({
      success: true,
      message: result.joined ? "Joined community" : "Left community",
      data: result.community,
    });
  } catch (err) {
    next(err);
  }
};
