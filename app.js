const express = require("express");

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializationServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
  }
};

initializationServerAndDB();

// API 1 GET Method Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM player_details;
    `;

  const dbResponse = await db.all(getPlayerDetailsQuery);
  response.send(dbResponse);
});

// API 2 GET Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerDetails = `
    SELECT 
    player_id as playerId,
    player_name as playerName
    FROM 
    player_details
    WHERE player_id = '${playerId}';
    `;
  const dbResponse = await db.get(getPlayerDetails);
  response.send(dbResponse);
});

// API 3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDet = request.body;

  const { playerName } = playerDet;

  const updatingPlayerDet = `
    UPDATE 
    player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = '${playerId}';
    `;
  await db.run(updatingPlayerDet);
  response.send("Player Details Updated");
});

// API 4 GET Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetails = `
    SELECT 
    match_id as matchId,
    match as match,
    year as year
    FROM 
    match_details
    WHERE match_id = ${matchId};
    `;
  let dbResponse = await db.get(getMatchDetails);
  response.send(dbResponse);
});

// API 5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getMatchId = `
    SELECT * FROM player_match_score WHERE player_id = ${playerId};
    `;
  let matchId = await db.all(getMatchId);
  //console.log(matchId);
  let matchIds = [];
  for (let i of matchId) {
    matchIds.push(i.match_id);
  }

  let result = [];

  for (let id of matchIds) {
    let getMatchDet = `
  SELECT 
  match_id as matchId,
  match as match,
  year as year
  FROM match_details WHERE match_id = ${id};
  `;
    const matchDetails = await db.get(getMatchDet);
    result.push(matchDetails);
  }

  response.send(result);
});

// API 6 GET Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getPlayerId = `
    SELECT 
    *
    FROM 
    player_match_score 
    WHERE match_id = ${matchId};`;

  const playerD = await db.all(getPlayerId);

  console.log(playerD);

  let playerIds = [];

  for (let a of playerD) {
    playerIds.push(a.player_id);
  }

  let result = [];

  for (let id of playerIds) {
    let getPlayerDetails = `
  SELECT 
  player_id as playerId,
  player_name as playerName
  FROM player_details WHERE player_id = ${id};
  `;

    const playerDetails = await db.get(getPlayerDetails);
    result.push(playerDetails);
  }

  response.send(result);
});

// API 7 GET Method Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getScores = `
SELECT 
SUM(score),
SUM(fours),
SUM(sixes)
FROM player_match_score WHERE player_id = ${playerId};
`;

  const dbResponse = await db.get(getScores);

  /*let scores = {
    totalScore: dbResponse["SUM(score)"],
    totalFours: dbResponse["SUM(fours)"],
    totalSixes: dbResponse["SUM(sixes)"],
  };
  console.log(scores);*/

  const getPlayerDetails = `
  SELECT
  *
  FROM player_details WHERE player_id = ${playerId};
  `;
  const getNames = await db.get(getPlayerDetails);

  const result = {
    playerId: getNames.player_id,
    playerName: getNames.player_name,
    totalScore: dbResponse["SUM(score)"],
    totalFours: dbResponse["SUM(fours)"],
    totalSixes: dbResponse["SUM(sixes)"],
  };

  //console.log(result);
  response.send(result);
});

module.exports = app;
