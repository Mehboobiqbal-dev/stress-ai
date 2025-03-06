const express = require("express");
const router = express.Router();
const User = require("../models/UserData");
const mongoose = require("mongoose");

const UserDataSchema = new mongoose.Schema({
  userId: String,
  history: [
    {
      message: String,
      response: String,
      heartRate: Number,
      timestamp: Date,
    },
  ],
});

module.exports = mongoose.model("UserData", UserDataSchema);

router.post("/saveChat", async (req, res) => {
  try {
    const { userId, message, response, heartRate } = req.body;
    await User.findOneAndUpdate(
      { userId },
      { $push: { history: { message, response, heartRate, timestamp: new Date() } } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Failed to save chat." });
  }
  router.get("/getTrends/:userId", async (req, res) => {
    try {
      const userData = await User.findOne({ userId: req.params.userId });
      if (!userData) return res.json({ history: [] });
  
      const last5 = userData.history.slice(-5); // Get last 5 records
      const avgHeartRate = last5.reduce((sum, entry) => sum + entry.heartRate, 0) / last5.length;
      const anxietyLevel = avgHeartRate > 110 ? "High Anxiety" : avgHeartRate > 90 ? "Mild Anxiety" : "Normal";
  
      res.json({ history: last5, avgHeartRate, anxietyLevel });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trends." });
    }
  });
  
});

module.exports = router;
