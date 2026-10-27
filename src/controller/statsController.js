import * as statsService from "../services/statsService.js";

export const getOverview = async (req, res, next) => {
  try {
    const data = await statsService.getOverview();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMapPins = async (req, res, next) => {
  try {
    const items = await statsService.getMapPins(req.query);
    res.status(200).json({ success: true, total: items.length, items });
  } catch (err) {
    next(err);
  }
};
