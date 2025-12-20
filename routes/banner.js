const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("../cloudinary");

// ---------------- MULTER MEMORY STORAGE ----------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- CLOUDINARY BUFFER UPLOAD ----------------
const uploadToCloudinary = (buffer, folder = "banners") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => (result ? resolve(result) : reject(error))
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// ==========================
// ADD NEW BANNER
// ==========================
router.post("/add", upload.single("image_url"), async (req, res) => {
  try {
    let image_url = "";
    let is_active = true;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image_url = result.secure_url;
    } else {
      return res.status(400).json({ error: "Image is required" });
    }

    const result = await pool.query(
      `INSERT INTO banners (image_url, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [image_url, is_active]
    );

    res.json({
      message: "Banner added successfully",
      banner: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// UPDATE BANNER (ACTIVE / IMAGE)
// ==========================
router.put("/update/:id", upload.single("image_file"), async (req, res) => {
  try {
    const { is_active } = req.body;

    // Keep existing image if not uploading new one
    let image_url = req.body.image_url;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image_url = result.secure_url;
    }

    const result = await pool.query(
      `UPDATE banners
       SET image_url=$1, is_active=$2
       WHERE id=$3
       RETURNING *`,
      [image_url, is_active, req.params.id]
    );

    res.json({
      message: "Banner updated successfully",
      banner: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// GET ALL BANNERS
// ==========================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM banners ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// GET BANNER BY ID
// ==========================
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM banners WHERE id=$1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Banner not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// DELETE BANNER
// ==========================
router.delete("/delete/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM banners WHERE id=$1`, [
      req.params.id,
    ]);

    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
