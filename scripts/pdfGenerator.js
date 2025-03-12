/**
 * Roughly index the sorting order of a character's text in 
 * Steven-Approved Order (SAO). This implements the SAO specification used
 * for all future scripts as given at 
 * https://bloodontheclocktower.com/news/sort-order-sao-update.
 * 
 * @param {String} text The ability text of the character in question
 * @returns An integer value. This can be compared to the results from other
 * calls to this function. Lower values indicate that the role appears higher
 * on the script. 
 */
function saoIndex(text) {
  SAO_PREFIXES = [
    "You start knowing",
    "At night",
    "Each dusk*",
    "Each night",
    "Each night*",
    "Each day",
    "Once per game, at night",
    "Once per game, at night*",
    "Once per game, during the day",
    "Once per game",
    "On your 1st night",
    "On your 1st day",
    "On Night X",

    "You think",
    "You are",
    "You have",
    "You do not know",
    "You might",
    "You",

    "When you die",
    "When you learn that you died",
    "When",

    "If you die",
    "If you died",
    "If you are \"mad\"",
    "If you",
    "If the Demon dies",
    "If the Demon kills",
    "If the Demon",
    "If both",
    "If there are 5 or more players alive",
    "If",

    "All players",
    "All",
    "The 1st time",
    "The",

    "Good",
    "Evil",
    "Players",
    "Minions",
    // Fallthrough: 
    "",
  ];
  
    // Atheist -- hardcoded exception
  if (text.startsWith("The Storyteller can break the game rules")) {
    return Infinity;
  }

  for (const [i, prefix] of SAO_PREFIXES.entries()) {
    if (text.startsWith(prefix))
      return i;
  }
}

/**
 * Implements the Steven-Approved Order (SAO) sorting used in all scripts, as 
 * specified by https://bloodontheclocktower.com/news/sort-order-sao-update.
 * 
 * First, sort the abilities based on the first few words of their ability text. 
 * Consult {@link saoIndex} for more details.
 * If that cannot determine the order of two characters, then use
 * the length of the character text, with longer going later.
 * If that fails, use the length of the characters' names, 
 * with longer going later.
 * If that fails, sort the characters alphabetically.
 * @param {*} first One of the characters being compared
 * @param {*} second One of the characters being compared
 * @returns an integer. If positive, then `first`  comes first in SAO.
 * Otherwise, `second` goes first in SAO.
 */
function compareRoles(first, second) {
  out = saoIndex(second["ability"]) - saoIndex(first["ability"]);
  if (out == 0) {
    out = second["ability"].length - first["ability"].length;
  }
  if (out == 0) {
    out = second["name"].length - first["name"].length;
  }
  if (out == 0) {
    out = second["name"] > first["name"] ? 1 : -1;
  }
  return out;
}

/**
 * Generate an HTML page that contains script data for all of the characters 
 * listed on the Grimoire. This page may then be printed to a PDF. 
 * 
 * @author The-ai123
 */
async function generateHTMLDocument() {
  update_current_script()

  // Start the HTML structure
    let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CURRENT_SCRIPT[0].name}</title>
    <style>
      @font-face {
        font-family: PiratesBay;
        src: url(sansation_light.woff);
      }
      body {
        margin: 10px;
        font-family: PiratesBay;
        font-size:x-small;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
        
      }
      td {
        vertical-align: top;
        padding: 3px;
        font-size:15px
      }
      img {
        max-width: 100%;
        height: auto;
      }
      h1 {
        font-size:30px
      }
        h2 {
        font-size:20px
      }
    </style>
    <script>
      alert("Print page to pdf");
    </script>
  </head>
  <body>
  <h1>${CURRENT_SCRIPT[0].name}</h1>`;

  // Generate rows from the provided arrays for townsfolk
  const roleIds = ["townsfolk", "outsider", "minion", "demon"];
  const roleNames = ["Townsfolk", "Outsider", "Minions", "Demons"];

  for (let i = 0; i < 4; i++) {
    const team = roleIds[i];
    const name = roleNames[i];

    html += generateRoleTable(team, name);
  }

  // Night Order
  const nightRoles = Object.entries(CURRENT_SCRIPT)
      .map(x => x[1])
      .filter(x => x["id"] != "_meta")
      .map(x => x["id"]);

  const firstNightSorted = nightRoles.filter(x => roles[x].firstNight != 0)
      .filter(x => !!roles[x].firstNight)
      .sort((x, y) => roles[x].firstNight - roles[y].firstNight);
  
  const otherNightSorted = nightRoles.filter(x => roles[x].otherNight != 0)
      .filter(x => !!roles[x].otherNight)
      .sort((x, y) => roles[x].otherNight - roles[y].otherNight);

  html +=`
  <table>
        <tr>
            <th><h2>First Night</h2></th>
            <th><h2>Other Nights</h2></th>
        </tr>`;

  const nightOrderLength = Math.max(firstNightSorted.length, otherNightSorted.length)

  for (let i = 0; i < nightOrderLength; i++) {
    html+=`
    <tr><td>`;
    if (i < firstNightSorted.length) {
      const role = roles[firstNightSorted[i]];
      html += `<img style="width: 7.5%" src="${role.image}" alt="${role.name}"> <b>${role.name}</b>`;
    }
    html += `</td><td>`;
    if (i < otherNightSorted.length) {
      const role = roles[otherNightSorted[i]];
      html += `<img style="width: 7.5%" src="${role.image}" alt="${role.name}"> <b>${role.name}</b>`;
    }
    html += `</td></tr>`;
  }
  html += "</table>";

  //Print jinxes
  html += generateJinxesTable();
  
  //Print travellers and fables
  html += generateRoleTable("traveller", "Travellers");
  html += generateRoleTable("fabled", "Fabled");

  // Close the HTML structure
  html +=`
  </body>
  </html>`;

  // Optional: Automatically open the generated HTML in a new window
  const newWindow = window.open();
  newWindow.document.write(html);
  newWindow.document.close();
}

/**
 * Create one of the role tables that will go on the final HTML document script. 
 * @param {String} type The internal id of the character type used for this role table.
 * @param {String} name The name to be displayed on the final HTML page.
 * @returns a string that can be parsed as HTML to generate a table with
 * the relevant role information of the characters of this type on the CURRENT_SCRIPT.
 */
function generateRoleTable(type, name) {
  let table = `<h2>${name}<table>`;

  CURRENT_SCRIPT
      .filter(x => x.id != '_meta')
      .map(x => roles[x.id])
      .filter(x => x.team == type)
      .sort(compareRoles)
      .forEach(role => {
        table += `
          <tr>
          <td style="width: 7.5%;"><img src="${role.image}" alt="${role.name}"></td>
          <td style="width: 15%; font-weight: bold;">${role.name}</td>
          <td style="width: 75%;">${role.ability}</td>
          </tr>`;
      });

  table += "</table>";

  return table;
}

/**
 * Generate a table containing all of the jinxes between characters in this script.
 * @returns a string that can be parsed as HTML to generate a table with all jinxes
 * between two characters on the CURRENT_SCRIPT.
 */
function generateJinxesTable() {
  const chars = new Set(CURRENT_SCRIPT.map(x => x.id).filter(x => x != "_meta"))
  let table = `<h2>Jinxes<h2><table>`;
  for (const char1 of chars) {
    const jinxList = roles[char1].jinx
    if (jinxList === undefined) continue;

    for (const jinx of jinxList) {
      const char2 = jinx.id
      if (!chars.has(char2)) continue;

      table += `
              <tr>
                <td style="width: 7.5%;"><img src="${roles[char1].image}" alt="${roles[char1].name}"></td>
                <td style="width: 15%; font-weight: bold;">${roles[char1].name}</td>
                <td style="width: 7.5%;"><img src="${roles[char2].image}" alt="${roles[char2].name}"></td>
                <td style="width: 15%; font-weight: bold;">${roles[char2].name}</td>
                <td style="width: 70%;">${jinx.reason}</td>
              </tr>`;
    }
  }
  table += "</table>";
  if (table === "<h2>Jinxes<h2><table></table>") return "";
  return table;
}

/**
 * Create a script containing only the characters whose tokens are on
 * the grimoire currently, and download that script as a .json file. 
 * 
 * @author The-ai123
 */
function download_current_script()
{
  update_current_script()
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(CURRENT_SCRIPT)));
  element.setAttribute('download', CURRENT_SCRIPT[0].name + ".json");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Change the name of the script based on user input. 
 * 
 * @author The-ai123
 */
function update_current_script_name(){
  CURRENT_SCRIPT[0].name = document.getElementById("script_upload_feedback").textContent;
}

/**
 * Update the CURRENT_SCRIPT to be only tokens that are on-screen currently. 
 * This deletes all previous script data. Only do this when generating a new script!
 * 
 * @author The-ai123
 */
function update_current_script(){
  //clear current script except for fabled
  CURRENT_SCRIPT = CURRENT_SCRIPT.filter(element => element.id == CURRENT_SCRIPT[0].id || element.team == "fabled");
  //repopulated based on tokens currently on screen(and not hidden or dead)
  onscreen_tokens = document.getElementById("token_layer").getElementsByClassName("role_token");
  for (i = 0; i < onscreen_tokens.length; i++) {
    if(onscreen_tokens[i].getAttribute("visibility")=="show" && onscreen_tokens[i].getAttribute("viability") == "alive"){
      let newElement = {"id":onscreen_tokens[i].role}
      // Deal with more complex homebrew, which must preserve all of their content.
      if (!(onscreen_tokens[i].role in base_roles)) newElement = roles[onscreen_tokens[i].role];
      if (!CURRENT_SCRIPT.some(element => element.id == newElement.id)) {
        CURRENT_SCRIPT.push(newElement); // Add the element only if it doesn't exist
      }
    }   
  }
}
