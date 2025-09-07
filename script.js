// Your Sleeper League ID
const leagueId = "1267911481467359232";

// Helper fetch for league-specific endpoints
async function fetchData(endpoint) {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/${endpoint}`);
  return res.json();
}

async function getLeague() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
  return res.json();
}

async function render() {
  const league = await getLeague();
  document.getElementById("league-name").textContent = league.name || "League";
  document.getElementById("league-season").textContent = `Season: ${league.season || ""}`;

  const users = await fetchData("users");
  const rosters = await fetchData("rosters");

  const userMap = {};
  users.forEach(u => userMap[u.user_id] = u);

  // Standings
  const standingsDiv = document.getElementById("standings");
  rosters
    .sort((a, b) => (b.settings?.wins || 0) - (a.settings?.wins || 0))
    .forEach(roster => {
      const owner = userMap[roster.owner_id];
      const avatar = owner?.avatar ? `https://sleepercdn.com/avatars/${owner.avatar}` : "https://placehold.co/40x40";

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="card-header">
          <img src="${avatar}" alt="Team Logo">
          <strong>${owner ? owner.display_name : "Unknown"}</strong>
        </div>
        Record: ${roster.settings?.wins || 0}-${roster.settings?.losses || 0}
        <div class="players" id="players-${roster.roster_id}"></div>
      `;
      standingsDiv.appendChild(div);
      addTopPlayers(roster, div.querySelector(`#players-${roster.roster_id}`));
    });

  // Determine current week
  const currentWeek = (league.settings && league.settings.leg) || league.current_week || league.settings?.scoring_period_id || 1;
  const matchups = await fetchData(`matchups/${currentWeek}`);

  const matchupsDiv = document.getElementById("matchups");
  const matchupGroups = {};
  matchups.forEach(m => {
    if (!matchupGroups[m.matchup_id]) matchupGroups[m.matchup_id] = [];
    matchupGroups[m.matchup_id].push(m);
  });

  Object.values(matchupGroups).forEach(pair => {
    const div = document.createElement("div");
    div.className = "card";

    const [team1, team2] = pair;
    const r1 = rosters.find(r => r.roster_id === team1.roster_id);
    const r2 = rosters.find(r => r.roster_id === team2.roster_id);
    const owner1 = userMap[r1?.owner_id];
    const owner2 = userMap[r2?.owner_id];

    const avatar1 = owner1?.avatar ? `https://sleepercdn.com/avatars/${owner1.avatar}` : "https://placehold.co/40x40";
    const avatar2 = owner2?.avatar ? `https://sleepercdn.com/avatars/${owner2.avatar}` : "https://placehold.co/40x40";

    div.innerHTML = `
      <div class="card-header">
        <img src="${avatar1}" alt="logo">
        <strong>${owner1 ? owner1.display_name : "Unknown"}</strong> 
        - ${team1.points?.toFixed(1) || 0} pts
      </div>
      <div class="card-header">
        <img src="${avatar2}" alt="logo">
        <strong>${owner2 ? owner2.display_name : "Unknown"}</strong> 
        - ${team2.points?.toFixed(1) || 0} pts
      </div>
    `;
    matchupsDiv.appendChild(div);
  });
}

// Show up to 3 player headshots
async function addTopPlayers(roster, container) {
  if (!roster.players || roster.players.length === 0) return;
  const sample = roster.players.slice(0, 3);
  sample.forEach(pid => {
    const img = document.createElement("img");
    img.src = `https://sleepercdn.com/content/nfl/players/${pid}.jpg`;
    img.alt = pid;
    img.onerror = () => { img.src = "https://placehold.co/36x36"; };
    container.appendChild(img);
  });
}

render();
