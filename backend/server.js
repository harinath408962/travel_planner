require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Trip = require("./tripModel");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ DB CONNECT ------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

// ------------------ MIDDLEWARE ------------------
// Auto-set a default user since login is removed
app.use((req, res, next) => {
  if (!req.body.userEmail && req.method !== "GET") {
    req.body.userEmail = "defaultUser@gmail.com";
  }
  next();
});

// ------------------ ROUTES ------------------

// Add Trip
app.post("/addTrip", async (req, res) => {
  try {
    const trip = await Trip.create(req.body);
    res.json(trip);
  } catch (err) {
    console.log("AddTrip Error:", err.message);
    res.status(500).json({ error: "Add trip failed" });
  }
});

// Get trips by user
app.get("/trips/:email", async (req, res) => {
  try {
    const email = req.params.email || "defaultUser@gmail.com";
    const trips = await Trip.find({ userEmail: email });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: "Get trips failed" });
  }
});

// Update
app.put("/updateTrip/:id", async (req, res) => {
  try {
    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete
app.delete("/deleteTrip/:id", async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ------------------ START SERVER ------------------
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
