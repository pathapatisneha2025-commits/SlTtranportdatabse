const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bannerRoutes = require("./routes/banner");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/banners", bannerRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
