const mongoose = require("mongoose");

const docSchema = new mongoose.Schema({
  userId: String,
  extractedText: String,
  imagePath: String,
  hash: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Document", docSchema);