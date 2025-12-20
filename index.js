const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bannerRoutes = require("./routes/banner");
const ServiceRoutes = require("./routes/services");
const BlogsRoutes = require("./routes/blogs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/banners",bannerRoutes);
app.use("/api/services",ServiceRoutes);
app.use("/api/blogs",BlogsRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
