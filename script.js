document.addEventListener("DOMContentLoaded", () => {
  const playerDropdown = document.getElementById("playerDropdown");
  const matchesContainer = document.getElementById("matchesContainer");
  const submitBtn = document.getElementById("submitBtn");

  // REPLACE with your CSV link from Google Sheets
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXb4p6uA6bu7bwUwGq9wqynZkz0UzxKAtr7Cr4XVvuoVPyT1pb3Qqhq8lTCb4rv3sKuJQVnaJr9NI8/pubhtml?gid=2049025787&single=true&output=csv";
  // REPLACE with your Apps Script Web App URL
  const appsScriptUrl = "https://script.google.com/macros/s/AKfycbzeyYo787WRHcCSjRw0BqWqfa_9pCAhj_0sSyjJvboNDEoOSfAwamyVyggljXVzAnSP5w/exec";

  // We'll store match data here:
  // matches = [
  //   { label: "Match 1: Samuel vs Briac", possibleWinners: ["Samuel", "Briac"] },
  //   { label: "Match 2: Hugo vs Jason",   possibleWinners: ["Hugo", "Jason"] },
  //   ...
  // ]
  let matches = [];

  // 1. Fetch CSV data from your Sheet
  fetch(csvUrl)
    .then(response => response.text())
    .then(csvData => {
      const lines = csvData.split("\n").map(line => line.split(","));
      // lines[i][0] => Column A (Dropdown players)
      // lines[i][1] => Column B (Match label)
      // lines[i][4] => Column E (Possible winner)

      // We'll gather:
      //   all distinct players from col A -> player dropdown
      //   match label from col B -> dynamic match objects
      //   possible winner from col E -> add to match's possibleWinners

      // Use a Set to track distinct players from Column A
      const playerSet = new Set();

      // Use a map for matches: key = matchLabel, value = array of possible winners
      const matchMap = {};

      // Skip the header row if you have one
      let startIndex = 0;
      if (lines[0][0].toLowerCase().includes("dropdown") 
          || lines[0][1].toLowerCase().includes("match")) {
        startIndex = 1; // skip the header
      }

      for (let i = startIndex; i < lines.length; i++) {
        const row = lines[i];
        if (!row || row.length < 5) continue; // skip blank/incomplete rows

        const playerName = row[0].trim();
        const matchLabel = row[1].trim();  // e.g. "Match 1: Samuel vs Briac"
        const possibleWinner = row[4].trim();

        // Collect players
        if (playerName) {
          playerSet.add(playerName);
        }

        // If Column B has "Match X: ..." we treat it as a match
        if (matchLabel && matchLabel.toLowerCase().startsWith("match")) {
          // Ensure we have a key for this match
          if (!matchMap[matchLabel]) {
            matchMap[matchLabel] = [];
          }
          // Add possible winner if non-empty
          if (possibleWinner) {
            matchMap[matchLabel].push(possibleWinner);
          }
        }
      }

      // Fill the "Who are you?" dropdown
      playerSet.forEach(player => {
        const option = document.createElement("option");
        option.value = player;
        option.textContent = player;
        playerDropdown.appendChild(option);
      });

      // Build the matches array from matchMap
      matches = Object.keys(matchMap).map(label => {
        return {
          label,
          possibleWinners: matchMap[label]
        };
      });

      // Sort by match number if desired (optional)
      matches.sort((a, b) => {
        // e.g. "Match 1:" vs "Match 2:"
        const aNum = parseInt(a.label.replace(/\D+/g, "")) || 0;
        const bNum = parseInt(b.label.replace(/\D+/g, "")) || 0;
        return aNum - bNum;
      });

      // Dynamically create a dropdown for each match
      matches.forEach(match => {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";

        const label = document.createElement("label");
        label.textContent = match.label + " Vainqueur: ";

        const select = document.createElement("select");
        select.name = match.label; // so we know which match this belongs to

        // Add each possible winner as an <option>
        match.possibleWinners.forEach(pw => {
          const opt = document.createElement("option");
          opt.value = pw;
          opt.textContent = pw;
          select.appendChild(opt);
        });

        div.appendChild(label);
        div.appendChild(select);
        matchesContainer.appendChild(div);
      });
    })
    .catch(err => console.error("Error fetching or parsing CSV:", err));

  // 2. On submit, gather picks & POST to Apps Script
  submitBtn.addEventListener("click", () => {
    const user = playerDropdown.value;
    const picks = {};

    // For each <select> inside matchesContainer, store the user’s choice
    const selects = matchesContainer.querySelectorAll("select");
    selects.forEach(sel => {
      picks[sel.name] = sel.value; 
      // sel.name is something like "Match 1: Samuel vs Briac"
      // sel.value is whichever possible winner they picked
    });

    // Build our payload
    const payload = {
      user,
      picks
    };

    // POST to Apps Script
    fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // If you get CORS issues, you can try mode: "no-cors",
      // but then you won't see the response
    })
      .then(response => response.json())
      .then(data => {
        console.log("Apps Script response:", data);
        if (data.status === "success") {
          alert("Your picks have been submitted!");
        } else {
          alert("Error submitting picks: " + JSON.stringify(data));
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        alert("Could not submit your picks.");
      });
  });
});
