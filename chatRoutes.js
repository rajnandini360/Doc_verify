const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    console.log("User:", userMessage);

    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command", // ✅ stable model
        prompt: `
You are DocVerify AI assistant.

Help with:
- document registration
- verification
- OCR issues
- troubleshooting

Keep answers short and helpful.

User: ${userMessage}
Bot:
        `,
        max_tokens: 120,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.generations[0].text.trim();

    res.json({ reply });

  } catch (err) {
    console.error("COHERE ERROR:", err.response?.data || err.message);
    res.status(500).json({ reply: "AI Error ❌" });
  }
});

module.exports = router;