document.addEventListener("DOMContentLoaded", () => {
  const playerDropdown = document.getElementById("playerDropdown");
  const matchesContainer = document.getElementById("matchesContainer");
  const submitBtn = document.getElementById("submitBtn");

  // REPLACE with your CSV link from Google Sheets
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXb4p6uA6bu7bwUwGq9wqynZkz0UzxKAtr7Cr4XVvuoVPyT1pb3Qqhq8lTCb4rv3sKuJQVnaJr9NI8/pub?gid=2049025787&single=true&output=csv";
  // REPLACE with your Apps Script Web App URL
  const appsScriptUrl = "https://script.google.com/macros/s/AKfycbzeyYo787WRHcCSjRw0BqWqfa_9pCAhj_0sSyjJvboNDEoOSfAwamyVyggljXVzAnSP5w/exec";

  let matches = [];

  fetch(csvUrl)
    .then(response => response.text())
    .then(csvData => {
      const lines = csvData.split("\n").map(line => line.split(","));
      const playerSet = new Set();
      const matchMap = {};

      let startIndex = 0;
      if (
        lines[0][0] &&
        lines[0][0].toLowerCase().includes("dropdown") || 
        (lines[0][1] && lines[0][1].toLowerCase().includes("match"))
      ) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const row = lines[i];
        if (!row || row.length < 2) continue;

        const playerName = row[0]?.trim();
        if (playerName) {
          playerSet.add(playerName);
        }

        const matchLabel = row[1]?.trim();
        if (!matchLabel || !matchLabel.toLowerCase().startsWith("match")) {
          continue;
        }

        let possibleWinners = [];
        const colonIndex = matchLabel.indexOf(":");
        if (colonIndex !== -1) {
          const afterColon = matchLabel.substring(colonIndex + 1).trim();
          const parts = afterColon.split(" vs ");
          if (parts.length === 2) {
            possibleWinners = parts.map(p => p.trim());
          }
        }

        if (row.length >= 5) {
          const colE = row[4]?.trim();
          if (colE) {
            possibleWinners = colE.split(",").map(p => p.trim());
          }
        }

        if (!matchMap[matchLabel]) {
          matchMap[matchLabel] = new Set();
        }
        possibleWinners.forEach(name => {
          if (name) matchMap[matchLabel].add(name);
        });
      }

      // Fill "Qui êtes-vous ?" dropdown from playerSet
      playerSet.forEach(player => {
        const option = document.createElement("option");
        option.value = player;
        option.textContent = player;
        playerDropdown.appendChild(option);
      });

      // Build final matches array from matchMap
      matches = Object.keys(matchMap).map(label => {
        return {
          label,
          possibleWinners: Array.from(matchMap[label])
        };
      });

      // Sort matches by match number (optional)
      matches.sort((a, b) => {
        const aNum = parseInt(a.label.replace(/\D+/g, "")) || 0;
        const bNum = parseInt(b.label.replace(/\D+/g, "")) || 0;
        return aNum - bNum;
      });

      // Dynamically build the match dropdowns
      matches.forEach(matchObj => {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";

        const label = document.createElement("label");
        label.textContent = matchObj.label + " I Vainqueur: ";

        const select = document.createElement("select");
        select.name = matchObj.label;

        matchObj.possibleWinners.forEach(pw => {
          const opt = document.createElement("option");
          opt.value = pw;
          opt.textContent = pw;
          select.appendChild(opt);
        });

        div.appendChild(label);
        div.appendChild(select);
        matchesContainer.appendChild(div);
      });

      // --------- NEW BLOCK for Tournament Winner ---------
      // Build a set of tournament contenders by gathering all possible winners
      const tournamentContendersSet = new Set();
      matches.forEach(matchObj => {
        matchObj.possibleWinners.forEach(name => tournamentContendersSet.add(name));
      });
      // Optional: convert to an array and sort alphabetically
      const tournamentContenders = Array.from(tournamentContendersSet).sort();

      // Create a new block for the overall tournament winner
      const tournamentDiv = document.createElement("div");
      tournamentDiv.style.marginBottom = "10px";

      const tournamentLabel = document.createElement("label");
      tournamentLabel.textContent = "Grand vainqueur du TIB 2025: ";

      const tournamentSelect = document.createElement("select");
      // Set the name attribute so it appears in the payload as "Gagnant du tournoi"
      tournamentSelect.name = "Gagnant du tournoi";
      tournamentSelect.id = "tournamentWinnerDropdown";

      tournamentContenders.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        tournamentSelect.appendChild(option);
      });

      tournamentDiv.appendChild(tournamentLabel);
      tournamentDiv.appendChild(tournamentSelect);
      // Append this new block after the match selections
      matchesContainer.appendChild(tournamentDiv);
      // -----------------------------------------------------
    })
    .catch(err => {
      console.error("Error fetching or parsing CSV:", err);
    });

  // When user clicks Submit, gather picks and send to Apps Script
  submitBtn.addEventListener("click", () => {
    const user = playerDropdown.value;
    const picks = {};

    // Loop through all select elements inside matchesContainer
    const selects = matchesContainer.querySelectorAll("select");
    selects.forEach(sel => {
      picks[sel.name] = sel.value;
    });

    const payload = {
      user,
      picks
    };

    fetch(appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(() => {
      alert("Your picks have been submitted!");
    })
    .catch(err => {
      console.error("Error submitting picks:", err);
      alert("Error submitting picks.");
    });
  });
});


// document.addEventListener("DOMContentLoaded", () => {
//   const playerDropdown = document.getElementById("playerDropdown");
//   const matchesContainer = document.getElementById("matchesContainer");
//   const submitBtn = document.getElementById("submitBtn");

//   // REPLACE with your CSV link from Google Sheets
//   const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXb4p6uA6bu7bwUwGq9wqynZkz0UzxKAtr7Cr4XVvuoVPyT1pb3Qqhq8lTCb4rv3sKuJQVnaJr9NI8/pub?gid=2049025787&single=true&output=csv";
//   // REPLACE with your Apps Script Web App URL
//   const appsScriptUrl = "https://script.google.com/macros/s/AKfycbzeyYo787WRHcCSjRw0BqWqfa_9pCAhj_0sSyjJvboNDEoOSfAwamyVyggljXVzAnSP5w/exec";

//   // We'll store all match info here
//   // Example shape: 
//   // [
//   //   { label: "Match 1: Samuel vs Briac", possibleWinners: ["Samuel","Briac"] },
//   //   { label: "Match 2: Hugo vs Jason",   possibleWinners: ["Hugo","Jason"] },
//   //   ...
//   // ]
//   let matches = [];

//   fetch(csvUrl)
//     .then(response => response.text())
//     .then(csvData => {
//       // Split into rows
//       const lines = csvData.split("\n").map(line => line.split(","));
//       // lines[i][0] => Column A (player)
//       // lines[i][1] => Column B (match label: "Match 1: X vs Y")
//       // lines[i][4] => Column E (optional: "X,Y")

//       // We'll keep track of unique players in a Set
//       const playerSet = new Set();
//       // For matches, we'll use an object map for convenience
//       const matchMap = {};

//       // If your sheet has a header row, detect and skip it
//       let startIndex = 0;
//       if (
//         lines[0][0] &&
//         lines[0][0].toLowerCase().includes("dropdown") || 
//         (lines[0][1] && lines[0][1].toLowerCase().includes("match"))
//       ) {
//         startIndex = 1;
//       }

//       for (let i = startIndex; i < lines.length; i++) {
//         const row = lines[i];
//         if (!row || row.length < 2) continue; // skip empty/incomplete lines

//         // Column A: "Dropdown players"
//         const playerName = row[0]?.trim();
//         if (playerName) {
//           playerSet.add(playerName);
//         }

//         // Column B: "Match X: Name1 vs Name2"
//         const matchLabel = row[1]?.trim();
//         if (!matchLabel || !matchLabel.toLowerCase().startsWith("match")) {
//           // Not a match row, skip
//           continue;
//         }

//         // We'll figure out the possible winners in one of two ways:
//         // A) Parse from Column B
//         // B) Read from Column E

//         // --- Approach A: parse from Column B (if Column E is empty) ---
//         // e.g. "Match 1: Samuel vs Briac" => possibleWinners = ["Samuel","Briac"]
//         let possibleWinners = [];
//         // Quick parse if we see " vs ":
//         const colonIndex = matchLabel.indexOf(":");
//         if (colonIndex !== -1) {
//           // e.g. "Samuel vs Briac"
//           const afterColon = matchLabel.substring(colonIndex + 1).trim();
//           // split by " vs "
//           const parts = afterColon.split(" vs ");
//           if (parts.length === 2) {
//             possibleWinners = parts.map(p => p.trim());
//           }
//         }

//         // --- Approach B: read from Column E if it exists ---
//         // If your sheet truly stores possible winners in col E (row[4]):
//         if (row.length >= 5) {
//           const colE = row[4]?.trim(); // e.g. "Samuel,Briac"
//           if (colE) {
//             // If you want to override the parse approach with column E data:
//             possibleWinners = colE.split(",").map(p => p.trim());
//           }
//         }

//         // Store them in the map
//         if (!matchMap[matchLabel]) {
//           matchMap[matchLabel] = new Set();
//         }
//         possibleWinners.forEach(name => {
//           if (name) matchMap[matchLabel].add(name);
//         });
//       }

//       // Fill "Who are you?" dropdown from playerSet
//       playerSet.forEach(player => {
//         const option = document.createElement("option");
//         option.value = player;
//         option.textContent = player;
//         playerDropdown.appendChild(option);
//       });

//       // Build final matches array from matchMap
//       matches = Object.keys(matchMap).map(label => {
//         return {
//           label,
//           possibleWinners: Array.from(matchMap[label]) // convert from Set to Array
//         };
//       });

//       // Sort matches by match number (optional)
//       matches.sort((a, b) => {
//         // e.g. "Match 1: ..." => extract "1", "2", ...
//         const aNum = parseInt(a.label.replace(/\D+/g, "")) || 0;
//         const bNum = parseInt(b.label.replace(/\D+/g, "")) || 0;
//         return aNum - bNum;
//       });

//       // Dynamically build the match dropdowns
//       matches.forEach(matchObj => {
//         const div = document.createElement("div");
//         div.style.marginBottom = "10px";

//         const label = document.createElement("label");
//         label.textContent = matchObj.label + " I Vainqueur: ";

//         const select = document.createElement("select");
//         select.name = matchObj.label; // so we know which match it belongs to

//         // Add each possible winner
//         matchObj.possibleWinners.forEach(pw => {
//           const opt = document.createElement("option");
//           opt.value = pw;
//           opt.textContent = pw;
//           select.appendChild(opt);
//         });

//         div.appendChild(label);
//         div.appendChild(select);
//         matchesContainer.appendChild(div);
//       });
//     })
//     .catch(err => {
//       console.error("Error fetching or parsing CSV:", err);
//     });

//   // When user clicks Submit, gather picks and send to Apps Script
//   submitBtn.addEventListener("click", () => {
//     const user = playerDropdown.value;
//     const picks = {};

//     // For each match dropdown
//     const selects = matchesContainer.querySelectorAll("select");
//     selects.forEach(sel => {
//       picks[sel.name] = sel.value;
//     });

//     // Build payload
//     const payload = {
//       user,
//       picks
//     };

//     // If you want to write back to your sheet
//       fetch(appsScriptUrl, {
//         method: "POST",
//         mode: "no-cors", // bypass CORS restrictions; response will be opaque
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//       })
//       .then(() => {
//         // We assume success because the response is opaque.
//         alert("Your picks have been submitted!");
//       })
//       .catch(err => {
//         console.error("Error submitting picks:", err);
//         alert("Error submitting picks.");
//       });
//   });
// });
