const express = require("express");
const router = express.Router();

const multer = require("multer");
const sharp = require("sharp");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const crypto = require("crypto");

const Document = require("../models/doc");

const upload = multer({ dest: "uploads/" });

/* ---------------- AUTH ---------------- */
const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthorized ❌" });
};

/* ---------------- PREPROCESS (IMPROVED) ---------------- */
const preprocess = async (inputPath) => {
  const output = inputPath + "-prep.png";

  await sharp(inputPath)
    .resize(1800)        // better resolution
    .grayscale()
    .normalize()
    .threshold(150)      // 🔥 improves OCR accuracy
    .sharpen()
    .toFile(output);

  return output;
};

/* ---------------- OCR (FIXED) ---------------- */
const extractText = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: {
          apikey: process.env.OCR_API_KEY,
          ...formData.getHeaders()
        },
        params: {
          language: "eng",
          OCREngine: 2
        }
      }
    );

    console.log("OCR RESPONSE:", response.data); // 🔍 DEBUG

    return response.data.ParsedResults?.[0]?.ParsedText || "";
  } catch (err) {
    console.error("OCR error:", err.message);
    return "";
  }
};

/* ---------------- CLEAN TEXT ---------------- */
const cleanText = (text) => {
  return text
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/* ---------------- FORMAT ---------------- */
const formatName = (text) => {
  return text
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/* ---------------- OCR PIPELINE ---------------- */
const runOCR = async (filePath) => {
  const processed = await preprocess(filePath);

  let rawText = await extractText(processed);

  // fallback if preprocessing fails
  if (!rawText || rawText.trim().length < 2) {
    console.log("Fallback to original image...");
    rawText = await extractText(filePath);
  }

  console.log("RAW TEXT:", rawText);

  const finalText = formatName(cleanText(rawText));

  console.log("FINAL TEXT:", finalText);

  return finalText;
};

/* ---------------- REGISTER ---------------- */
router.post("/register", checkAuth, upload.single("file"), async (req, res) => {
  try {
    const finalText = await runOCR(req.file.path);

    if (!finalText || finalText.length < 2) {
      return res.status(400).json({
        success: false,
        status: "No readable text ❌"
      });
    }

    const hash = crypto.createHash("sha256").update(finalText).digest("hex");

    await Document.create({
      userId: req.user.id,
      extractedText: finalText,
      imagePath: req.file.path,
      hash,
      status: "Registered"
    });

    res.json({
      success: true,
      status: "Registered ✅",
      text: finalText
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ---------------- VERIFY ---------------- */
router.post("/verify", checkAuth, upload.single("file"), async (req, res) => {
  try {
    const finalText = await runOCR(req.file.path);

    if (!finalText || finalText.length < 2) {
      return res.status(400).json({
        success: false,
        status: "No readable text ❌"
      });
    }

    const hash = crypto.createHash("sha256").update(finalText).digest("hex");

    const existing = await Document.findOne({ hash });

    const status = existing ? "Valid" : "Invalid";

    await Document.create({
      userId: req.user.id,
      extractedText: finalText,
      imagePath: req.file.path,
      hash,
      status
    });

    res.json({
      success: !!existing,
      status: existing ? "Valid ✅" : "Invalid ❌",
      text: finalText
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ---------------- HISTORY ---------------- */
router.get("/documents", checkAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;