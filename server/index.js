const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const LRUCache = require("lru-cache");

const app = express();
app.use(cors());

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60 // 1 hour
});

// === GET TODAY'S APOD ===
app.get("/api/today", async (req, res) => {
  try {
    const cacheKey = "today";

    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const response = await axios.get(
      `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`
    );

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "NASA API error" });
  }
});

// === GET APOD BY DATE ===
app.get("/api/date", async (req, res) => {
  try {
    const { date } = req.query;
    const cacheKey = `date-${date}`;

    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const response = await axios.get(
      `https://api.nasa.gov/planetary/apod?date=${date}&api_key=${process.env.NASA_API_KEY}`
    );

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    res.status(400).json({ error: "Invalid date or API error" });
  }
});

// === GALLERY (LAST 10 DAYS) ===
app.get("/api/gallery", async (req, res) => {
  try {
    const cacheKey = "gallery";

    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 10);

    const url = `https://api.nasa.gov/planetary/apod?start_date=${start.toISOString().slice(0, 10)}&end_date=${today.toISOString().slice(0, 10)}&api_key=${process.env.NASA_API_KEY}`;

    const response = await axios.get(url);

    cache.set(cacheKey, response.data.reverse());
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Gallery loading failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
