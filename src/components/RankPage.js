import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RankPage.css";

function RankPage() {
  const [rankData, setRankData] = useState(null);
  const [error, setError] = useState(null);

  // Define the rank hierarchy with Emerald between Platinum and Diamond
  const rankOrder = [
    "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"
  ];

  // Helper function to convert division to a numeric value for comparison
  const divisionOrder = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4
  };

  const [userPrompt, setUserPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAiError(null); // Clear previous errors
    setAiResponse("Loading..."); // Indicate loading
  
    try {
      const response = await axios.post("https://client-2-piia.onrender.com", { prompt: userPrompt });
      setAiResponse(response.data.response);
    } catch (error) {
      console.error("Full error:", error.response ? error.response.data : error); // More detailed logging
      setAiError(error.response?.data?.error || "An error occurred. Please try again.");
      setAiResponse(""); // Clear loading message on error
    }
  };

  function AnimatedBackground() {
    useEffect(() => {
      const createSnowflake = () => {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        
        // Random starting X position
        snowflake.style.left = Math.random() * 100 + 'vw';
        
        // Random size between 5px and 20px
        const size = Math.random() * 15 + 5;
        snowflake.style.width = size + 'px';
        snowflake.style.height = size + 'px';
        
        // Random fall speed
        const duration = Math.random() * 10 + 5;
        snowflake.style.animationDuration = duration + 's';
        
        // Random horizontal drift
        const drift = Math.random() * 20 - 10;
        snowflake.style.animationDelay = Math.random() * -20 + 's';
        snowflake.style.transform = `translateX(${drift}px)`;
        
        document.querySelector('.animation-container').appendChild(snowflake);
        
        // Remove snowflake after animation ends
        setTimeout(() => {
          snowflake.remove();
        }, duration * 1000);
      };

      // Create snowflakes at intervals
      const snowInterval = setInterval(createSnowflake, 300);

      // Clean up interval when component unmounts
      return () => clearInterval(snowInterval);
    }, []);

    return <div className="animation-container"></div>;
  }

 // Function to generate OP.GG link with tagline
 const getOpGgLink = (summonerName, tagline) => {
  return `https://op.gg/summoners/na/${summonerName}-${tagline}`;
};

  // New function to sort summoners by ELO (total LP)
  const sortSummonersByElo = (a, b) => {
    // Filter for solo queue rank
    const soloQueueRankA = a.ranks.find(entry => entry.queueType === "RANKED_SOLO_5x5");
    const soloQueueRankB = b.ranks.find(entry => entry.queueType === "RANKED_SOLO_5x5");

    // If either summoner doesn't have a solo queue rank, handle that case
    if (!soloQueueRankA) return 1;
    if (!soloQueueRankB) return -1;

    // Compare tiers first
    const tierComparison = rankOrder.indexOf(soloQueueRankB.tier) - rankOrder.indexOf(soloQueueRankA.tier);
    if (tierComparison !== 0) return tierComparison;

    // If tiers are the same, compare divisions
    const divisionComparison = divisionOrder[soloQueueRankA.rank] - divisionOrder[soloQueueRankB.rank];
    if (divisionComparison !== 0) return divisionComparison;

    // If divisions are the same, compare LP
    return soloQueueRankB.leaguePoints - soloQueueRankA.leaguePoints;
  };

  useEffect(() => {
    const fetchRankData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/rank");
        console.log("Received Rank Data:", response.data);
        setRankData(response.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to fetch rank data. Please try again later.");
      }
    };

    fetchRankData();
  }, []);

  return (
    <div className="rank-page">
      <AnimatedBackground/>
      <div className="content">
        <h1>League of Legends Rank Viewer</h1>
        {error && <p className="error">{error}</p>}

        {rankData ? (
          <div className="rank-info">
            {rankData
              .sort(sortSummonersByElo) // Sort summoners by ELO
              .map((summonerData, index) => (
                <div key={index}>
                  {summonerData.ranks && summonerData.ranks.length > 0 ? (
                    summonerData.ranks
                      .filter((entry) => entry.queueType === "RANKED_SOLO_5x5")
                      .map((entry, subIndex) => (
                        <div key={subIndex} className="rank-entry">
                          <h2>
                            <a 
                              href={getOpGgLink(summonerData.summonerName, summonerData.tagline)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {summonerData.summonerName || 'Unknown Summoner'}
                            </a>
                          </h2>
                          <p><strong>Rank:</strong> {entry.tier} {entry.rank}</p>
                          <p><strong>LP:</strong> {entry.leaguePoints}</p>
                          <p><strong>Wins:</strong> {entry.wins}</p>
                          <p><strong>Losses:</strong> {entry.losses}</p>
                        </div>
                      ))
                  ) : (
                    <div className="rank-entry">
                      <h2>
                        <a 
                          href={getOpGgLink(summonerData.summonerName, summonerData.tagline)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {summonerData.summonerName || 'Unknown Summoner'}
                        </a>
                      </h2>
                      <p>No ranked data available</p>
                    </div>
                  )}
                </div>
              ))}
               <div className="prompt-section">
            <h1>Ask Something About LOL</h1>
            <form onSubmit={handleSubmit}>
            <input
    type="text"
    placeholder="Enter your prompt..."
    value={userPrompt}
    onChange={(e) => setUserPrompt(e.target.value)}
    id="user-prompt-input"  // Added id attribute
    name="userPrompt"       // Added name attribute
  />
                <button type="submit">Get Answer</button>
            </form>
            {aiResponse && <div className="ai-response"> {aiResponse} </div>}
            {aiError && <p className="error">{aiError}</p>}
        </div>
          </div>
        ) : (
          <p>Loading rank data...</p>
        )}
      </div>
    </div>
  );
}

export default RankPage;
