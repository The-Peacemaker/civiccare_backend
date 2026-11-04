import { categoryLabel, priorityLabel, statusLabel } from "../config/constants.js";
import { formatDate, timeAgo } from "../utils/time.js";

const asObject = (doc) => (doc && doc.toObject ? doc.toObject() : doc);

const populatedAuthor = (author) => (author && typeof author === "object" ? author : null);

const authorId = (author) => {
  if (!author) return "";
  const value = typeof author === "object" ? author._id : author;
  return value ? String(value) : "";
};

const CATEGORY_EMOJI = {
  corruption: "💰",
  infrastructure: "🚧",
  water: "💧",
  electricity: "💡",
  sanitation: "🗑️",
  safety: "🛡️",
  other: "📌",
};

const CATEGORY_COVER = {
  corruption: "from-orange-500 via-red-500 to-rose-600",
  infrastructure: "from-amber-500 via-orange-500 to-red-500",
  water: "from-cyan-500 via-blue-500 to-indigo-600",
  electricity: "from-yellow-400 via-amber-500 to-orange-500",
  sanitation: "from-emerald-500 to-teal-600",
  safety: "from-sky-500 to-blue-600",
  other: "from-slate-500 to-slate-700",
};

const baseFields = (c, viewerId) => {
  const isMine = Boolean(viewerId) && authorId(c.author) === String(viewerId);
  const locationText = c.location?.text || "";
  return {
    id: String(c._id),
    _id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    categoryLabel: categoryLabel(c.category),
    emoji: CATEGORY_EMOJI[c.category] || "📌",
    cover: CATEGORY_COVER[c.category] || CATEGORY_COVER.other,
    status: c.status,
    statusKey: c.status,
    statusLabel: statusLabel(c.status),
    priority: c.priority,
    priorityLabel: priorityLabel(c.priority),
    // Flat string for cards, structured object for map/detail views.
    location: locationText,
    locationText,
    locationData: {
      text: locationText,
      district: c.location?.district || "",
      latitude: c.location?.latitude ?? null,
      longitude: c.location?.longitude ?? null,
    },
    coords: {
      lat: c.location?.latitude ?? null,
      lng: c.location?.longitude ?? null,
    },
    imageUrls: c.imageUrls || [],
    images: c.imageUrls || [],
    image: (c.imageUrls && c.imageUrls[0]) || "",
    upvoteCount: c.upvoteCount || 0,
    commentCount: c.commentCount || 0,
    shareCount: c.shareCount || 0,
    // Frontend-friendly aliases (feed cards use likes/comments/shares).
    likes: c.upvoteCount || 0,
    comments: c.commentCount || 0,
    shares: c.shareCount || 0,
    total: (c.upvoteCount || 0) + (c.commentCount || 0) + (c.shareCount || 0),
    isMine,
    mine: isMine,
    timeAgo: timeAgo(c.createdAt),
    date: formatDate(c.createdAt),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

const publicAuthor = (c) => {
  const author = populatedAuthor(c.author);
  const hidden = c.isAnonymous || !author || author.isGuest;
  if (hidden) {
    return {
      name: author?.anonymousHandle || "Anonymous User",
      avatarUrl: "",
      isAnonymous: true,
    };
  }
  return { name: author.name, avatarUrl: author.avatarUrl || "", isAnonymous: false };
};

// Public feed/map response. Author identity is never leaked here.
// Rule: a post is publicly anonymous when it is flagged anonymous OR the
// author is a guest account.
export const toPublicComplaint = (doc, viewerId) => {
  const c = asObject(doc);
  const author = publicAuthor(c);

  return {
    ...baseFields(c, viewerId),
    isAnonymous: author.isAnonymous,
    // `author` is a display string (used by the feed cards); the structured
    // object is exposed as `authorUser` for richer views.
    author: author.name,
    authorName: author.name,
    authorUser: author,
  };
};

// Admin / authority response. Includes the full identity trail so moderators
// can act on anonymous reports.
export const toAdminComplaint = (doc, viewerId) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);
  const assignedTo = populatedAuthor(c.assignedTo);

  return {
    ...baseFields(c, viewerId),
    isAnonymous: Boolean(c.isAnonymous),
    author: author
      ? {
          _id: author._id,
          name: author.name,
          email: author.email || null,
          role: author.role,
          authProvider: author.authProvider,
          isGuest: author.isGuest,
          anonymousHandle: author.anonymousHandle || "",
          avatarUrl: author.avatarUrl || "",
        }
      : null,
    authorName: author?.name || "Anonymous User",
    assignedTo: assignedTo
      ? { _id: assignedTo._id, name: assignedTo.name, email: assignedTo.email || null }
      : null,
    resolvedAt: c.resolvedAt,
  };
};

export const toPublicComment = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);
  const hidden = c.isAnonymous || !author || author.isGuest;
  const name = hidden ? author?.anonymousHandle || "Anonymous User" : author.name;

  return {
    id: String(c._id),
    _id: c._id,
    body: c.body,
    text: c.body,
    msg: c.body,
    postId: c.complaint ? String(c.complaint) : null,
    complaintId: c.complaint || null,
    isAnonymous: hidden,
    author: name,
    authorName: name,
    authorUser: {
      name,
      avatarUrl: hidden ? "" : author?.avatarUrl || "",
      isAnonymous: hidden,
    },
    time: timeAgo(c.createdAt),
    timeAgo: timeAgo(c.createdAt),
    date: formatDate(c.createdAt),
    createdAt: c.createdAt,
  };
};

export const toAdminComment = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);

  return {
    id: String(c._id),
    _id: c._id,
    body: c.body,
    text: c.body,
    msg: c.body,
    postId: c.complaint ? String(c.complaint) : null,
    complaintId: c.complaint || null,
    isAnonymous: Boolean(c.isAnonymous),
    author: author
      ? { _id: author._id, name: author.name, email: author.email || null, isGuest: author.isGuest }
      : null,
    authorName: author?.name || "Anonymous User",
    time: timeAgo(c.createdAt),
    timeAgo: timeAgo(c.createdAt),
    date: formatDate(c.createdAt),
    createdAt: c.createdAt,
  };
};
