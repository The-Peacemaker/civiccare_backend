export const uploadImage = (req, res) => {
  const file = req.file || (Array.isArray(req.files) ? req.files[0] : null);
  if (!file) {
    return res.status(400).json({ success: false, message: "No image uploaded (field: photo)" });
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
  res.status(201).json({
    success: true,
    message: "Image uploaded",
    data: {
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    },
  });
};
