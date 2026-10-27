const asObject = (doc) => (doc && doc.toObject ? doc.toObject() : doc);

const populatedAuthor = (author) => (author && typeof author === "object" ? author : null);

// Public feed/map response. Author identity is never leaked here.
// Rule: a post is publicly anonymous when it is flagged anonymous OR the
// author is a guest account.
export const toPublicComplaint = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);
  const hidden = c.isAnonymous || !author || author.isGuest;

  return {
    _id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,
    priority: c.priority,
    location: c.location,
    locationText: c.location?.text || "",
    coords: {
      lat: c.location?.latitude ?? null,
      lng: c.location?.longitude ?? null,
    },
    imageUrls: c.imageUrls || [],
    upvoteCount: c.upvoteCount || 0,
    commentCount: c.commentCount || 0,
    // Frontend-friendly aliases (feed cards use likes/comments).
    likes: c.upvoteCount || 0,
    comments: c.commentCount || 0,
    isAnonymous: hidden,
    author: hidden
      ? {
          name: author?.anonymousHandle || "Anonymous User",
          avatarUrl: "",
          isAnonymous: true,
        }
      : {
          name: author.name,
          avatarUrl: author.avatarUrl || "",
          isAnonymous: false,
        },
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

// Admin / authority response. Includes the full identity trail so moderators
// can act on anonymous reports.
export const toAdminComplaint = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);
  const assignedTo = populatedAuthor(c.assignedTo);

  return {
    _id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,
    priority: c.priority,
    location: c.location,
    imageUrls: c.imageUrls || [],
    upvoteCount: c.upvoteCount || 0,
    commentCount: c.commentCount || 0,
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
    assignedTo: assignedTo
      ? { _id: assignedTo._id, name: assignedTo.name, email: assignedTo.email || null }
      : null,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

export const toPublicComment = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);
  const hidden = c.isAnonymous || !author || author.isGuest;

  return {
    _id: c._id,
    body: c.body,
    isAnonymous: hidden,
    author: hidden
      ? { name: author?.anonymousHandle || "Anonymous User", isAnonymous: true }
      : { name: author.name, avatarUrl: author.avatarUrl || "", isAnonymous: false },
    createdAt: c.createdAt,
  };
};

export const toAdminComment = (doc) => {
  const c = asObject(doc);
  const author = populatedAuthor(c.author);

  return {
    _id: c._id,
    body: c.body,
    isAnonymous: Boolean(c.isAnonymous),
    author: author
      ? { _id: author._id, name: author.name, email: author.email || null, isGuest: author.isGuest }
      : null,
    createdAt: c.createdAt,
  };
};
