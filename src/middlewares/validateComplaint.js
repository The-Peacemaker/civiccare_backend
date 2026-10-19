const ALLOWED_CATEGORIES = ["road", "water", "waste", "electricity", "safety", "other"];

// Rejects bad POST bodies early with a clear message for the Postman demo.
export const validateComplaint = (req, res, next) => {
  const { title, description, location, category } = req.body || {};
  const errors = [];

  if (!title || !String(title).trim()) errors.push("title is required");
  if (!description || !String(description).trim()) errors.push("description is required");
  if (!location || !String(location).trim()) errors.push("location is required");

  if (category && !ALLOWED_CATEGORIES.includes(String(category).toLowerCase())) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // Normalise category to lowercase so "Road" also works
  if (req.body.category) req.body.category = String(req.body.category).toLowerCase();

  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler — must be registered last in app.js
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
};
