const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); // Added Morgan
const menuRoutes = require("./routes/menu");
const itemRoutes = require("./routes/items");

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('dev')); // Added Morgan middleware for request logging
app.use(express.json());

// Routes
app.use("/api/menu", menuRoutes);
app.use("/api/items", itemRoutes);

// Test route
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "Server working!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = 3000; // Changed from 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});