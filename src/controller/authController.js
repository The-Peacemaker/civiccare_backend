import * as authService from "../services/authService.js";
import { toSelfUser } from "../serializers/userSerializer.js";

const ok = (res, status, message, data) =>
  res.status(status).json({ success: true, message, data });

export const register = async (req, res, next) => {
  try {
    ok(res, 201, "Account created", await authService.register(req.body));
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    ok(res, 200, "Logged in", await authService.login(req.body));
  } catch (err) {
    next(err);
  }
};

export const guest = async (req, res, next) => {
  try {
    ok(res, 201, "Guest session created", await authService.guest());
  } catch (err) {
    next(err);
  }
};

export const google = async (req, res, next) => {
  try {
    ok(res, 200, "Logged in with Google", await authService.googleLogin(req.body));
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    ok(res, 200, "Token refreshed", await authService.refresh(req.body));
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res) => {
  res.status(200).json({ success: true, data: toSelfUser(req.user) });
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out. Discard the stored tokens on the client.",
  });
};
