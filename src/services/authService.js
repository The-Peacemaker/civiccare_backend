import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { toSelfUser } from "../serializers/userSerializer.js";
import { httpError } from "../utils/httpError.js";

const ACCESS_SECRET = process.env.JWT_SECRET || "dev-access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sign = (user, secret, ttl, type) =>
  jwt.sign(
    { sub: String(user._id), role: user.role, isGuest: Boolean(user.isGuest), type },
    secret,
    { expiresIn: ttl }
  );

export const issueTokens = (user) => ({
  accessToken: sign(user, ACCESS_SECRET, ACCESS_TTL, "access"),
  refreshToken: sign(user, REFRESH_SECRET, REFRESH_TTL, "refresh"),
  tokenType: "Bearer",
  expiresIn: ACCESS_TTL,
});

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);

const hashPassword = (password) => bcrypt.hash(password, 10);

const makeAnonymousHandle = async () => {
  for (let i = 0; i < 20; i += 1) {
    const handle = `Anonymous User ${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await User.exists({ anonymousHandle: handle });
    if (!exists) return handle;
  }
  return `Anonymous User ${Date.now().toString().slice(-4)}`;
};

const authPayload = (user) => ({
  user: toSelfUser(user),
  tokens: issueTokens(user),
});

export const register = async (payload) => {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!name) throw httpError(400, "Name is required");
  if (!EMAIL_RE.test(email)) throw httpError(400, "A valid email is required");
  if (password.length < 8) throw httpError(400, "Password must be at least 8 characters");

  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, "An account with this email already exists");

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    authProvider: "password",
    role: "citizen",
  });

  return authPayload(user);
};

export const login = async (payload) => {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  if (!email || !password) throw httpError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) throw httpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw httpError(401, "Invalid email or password");

  return authPayload(user);
};

export const guest = async () => {
  const anonymousHandle = await makeAnonymousHandle();
  const user = await User.create({
    name: "Anonymous User",
    authProvider: "guest",
    isGuest: true,
    role: "citizen",
    anonymousHandle,
  });
  return authPayload(user);
};

export const googleLogin = async (payload) => {
  const idToken = String(payload.idToken || "");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw httpError(501, "Google sign-in is not configured");
  if (!idToken) throw httpError(400, "idToken is required");

  const client = new OAuth2Client(clientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: clientId });
  } catch {
    throw httpError(401, "Invalid Google token");
  }

  const profile = ticket.getPayload();
  if (!profile?.email) throw httpError(401, "Google account has no email");

  let user = await User.findOne({ googleId: profile.sub });
  if (!user) user = await User.findOne({ email: profile.email.toLowerCase() });

  if (user) {
    user.googleId = user.googleId || profile.sub;
    user.authProvider = "google";
    if (!user.name) user.name = profile.name || user.name;
    if (!user.avatarUrl) user.avatarUrl = profile.picture || "";
    await user.save();
  } else {
    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: profile.email.toLowerCase(),
      googleId: profile.sub,
      avatarUrl: profile.picture || "",
      authProvider: "google",
      role: "citizen",
    });
  }

  return authPayload(user);
};

export const refresh = async (payload) => {
  const token = String(payload.refreshToken || "");
  if (!token) throw httpError(400, "refreshToken is required");

  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch {
    throw httpError(401, "Invalid or expired refresh token");
  }
  if (decoded.type !== "refresh") throw httpError(401, "Invalid refresh token");

  const user = await User.findById(decoded.sub);
  if (!user) throw httpError(401, "Account not found");

  return authPayload(user);
};
