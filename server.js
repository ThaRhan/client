const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");


require('dotenv').config();


const app = express();
const PORT = 3001;

// Riot API Key (keep this private)
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Make sure to include these imports:
// import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });




// Predefined list of encrypted summoner IDs with hardcoded names and taglines
const summonerData = [
  {
    encryptedId: "27824-1IGk3cp_adnk9JKa0At47FaO2ArCSOr-uqvnCMF9B6",
    summonerName: "ThaRhan",
    tagline: "NA1"
  },
  {
    encryptedId: "ubV-ARKqqmYCc_TfEwCwPJEOPR3d6acEagSGKp9NGYoQbrJL",
    summonerName: "DonRamon",
    tagline: "0909"
  },
  {
    encryptedId: "d8gEXb7fzoax_fhNc9vD1dIAA6_cyObLa-6hKfYZKKVU",
    summonerName: "IllegalSmiles",
    tagline: "NA1"
  },
  {
    encryptedId: "WYl6cydQnhPvYF1VhzAsM-NMc52OCWPehjdUSEE_krBMONGi3NrOaODX-w",
    summonerName: "JuniorCruiz123",
    tagline: "5776"
  }
];

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Make sure this matches your React app's port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Route to fetch summoner rank data
app.get("/api/rank", async (req, res) => {
  try {
    // Loop through the predefined summoner IDs and fetch rank data for each
    const rankData = await Promise.all(
      summonerData.map(async (summoner) => {
        try {
          // Fetch rank data
          const rankResponse = await axios.get(
            `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.encryptedId}`,
            {
              headers: {
                "X-Riot-Token": RIOT_API_KEY,
              },
            }
          );

          

          return {
            ranks: rankResponse.data,
            summonerName: summoner.summonerName,
            tagline: summoner.tagline
          };
        } catch (innerError) {
          console.error(`Error fetching data for summoner ${summoner.summonerName}:`, innerError.response ? innerError.response.data : innerError.message);
          return {
            ranks: [],
            summonerName: summoner.summonerName,
            tagline: summoner.tagline
          };
        }
      })
    );

    res.status(200).json(rankData);
  } catch (error) {
    console.error("Error in /api/rank route:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/ai", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text(); // Use await here
    res.json({ response: responseText });
  } catch (error) {
    console.error("Error in /api/ai route:", error);
    res.status(500).json({ error: `AI processing failed: ${error.message}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
