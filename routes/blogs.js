const express = require("express");
const pool = require("../db");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

/* ===============================
   MULTER + CLOUDINARY STORAGE
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

/* ===============================
   ROUTER
================================ */
const router = express.Router();

/* FRONTEND – GET ACTIVE BLOGS */
router.get("/all", async (req, res) => {
  try {
    const blogs = await pool.query(
      "SELECT * FROM blogs WHERE is_active=true ORDER BY created_at DESC"
    );
    res.json(blogs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ADMIN – GET ALL BLOGS */
router.get("/", async (req, res) => {
  try {
    const blogs = await pool.query(
      "SELECT * FROM blogs ORDER BY created_at DESC"
    );
    res.json(blogs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* CREATE BLOG */
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { title, description, slug } = req.body;
    const image_url = req.file.path;

    const blog = await pool.query(
      `INSERT INTO blogs (title, description, image_url, slug)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [title, description, image_url, slug]
    );

    res.json(blog.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* TOGGLE */
router.patch("/:id", async (req, res) => {
  try {
    const blog = await pool.query(
      "UPDATE blogs SET is_active = NOT is_active WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    res.json(blog.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM blogs WHERE id=$1", [req.params.id]);
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // ✅ IMPORTANT
