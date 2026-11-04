const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);

const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    out[key] = clean(child);
  }
  return out;
};

// Strips Mongo operator keys ($gt, $where, dotted paths) from user input.
export const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      if (key.startsWith("$") || key.includes(".")) delete req.params[key];
    }
  }
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (key.startsWith("$") || key.includes(".")) delete req.query[key];
    }
  }
  next();
};
