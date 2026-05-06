const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const session = require("express-session");
const passport = require("./config/passport");

const app = express();

/* Middleware */
app.use(express.json());
app.use(cors({ origin: "http://localhost:5000", credentials: true }));

/* Session */
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* Static */
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static("uploads"));

/* Routes */
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/docRoutes"));
const chatRoutes = require("./routes/chatRoutes");
app.use("/api", chatRoutes);

/* Pages */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dashboard.html"));
});

/* DB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server running"));