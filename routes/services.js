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
const uploadToCloudinary = (buffer, folder = "services") => {
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
// ADD NEW SERVICE
// ==========================
router.post("/add", upload.single("image_file"), async (req, res) => {
  try {
    const { title, description, points } = req.body;
    let image_url = "";

    if (!req.file) {
      return res.status(400).json({ error: "Service image is required" });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);
    image_url = uploadResult.secure_url;

    // ✅ SAFE parsing
    let pointsArray = [];

    if (Array.isArray(points)) {
      pointsArray = points;
    } else if (typeof points === "string") {
      try {
        // Try JSON first
        pointsArray = JSON.parse(points);
      } catch {
        // Fallback: comma-separated string
        pointsArray = points.split(",").map(p => p.trim());
      }
    }

    const result = await pool.query(
      `INSERT INTO services (title, image_url, description, points)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, image_url, description, pointsArray]
    );

    res.status(201).json({
      message: "Service added successfully",
      service: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ==========================
// GET ALL SERVICES
// ==========================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM services ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// DELETE SERVICE
// ==========================
router.delete("/delete/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM services WHERE id=$1`, [req.params.id]);
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;