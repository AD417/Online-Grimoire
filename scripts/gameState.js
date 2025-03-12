/**
 * Convert the game state to a JSON string.
 * @returns A JSON string containing the game state.
 */
function generate_game_state_json() {
  var state = new Object();
  state.script = CURRENT_SCRIPT;
  state.scriptColor = document.getElementById("script_upload_feedback").getAttribute("used");
  state.scriptNumber = document.getElementById("script_options").selectedIndex;
  state.playercount = document.getElementById("player_count").value;
  state.night = document.getElementById("body_actual").getAttribute("night");
  state.orientation = document.getElementById("body_actual").getAttribute("orientation");
  state.background = document.getElementById("body_actual").style.getPropertyValue("--BG-IMG");
  state.players = [];
  players = document.getElementById("token_layer").getElementsByClassName("role_token");
  for (i = 0; i < players.length; i++)
  {
    state.players[i] = new Object();
    state.players[i].role = players[i].getAttribute("role");
    state.players[i].uid = players[i].getAttribute("uid");
    state.players[i].visibility = players[i].getAttribute("visibility");
    state.players[i].viability = players[i].getAttribute("viability");
    state.players[i].cat = players[i].getAttribute("cat");
    state.players[i].show_face = players[i].getAttribute("show_face");
    state.players[i].left = players[i].style.left;
    state.players[i].top = players[i].style.top;
    state.players[i].name = players[i].getElementsByClassName("token_text")[0].innerHTML;
  }
  state.reminders = [];
  reminders = document.getElementById("remainerLayer").getElementsByClassName("reminder");
  for (i = 0; i < reminders.length; i++)
  {
    state.reminders[i] = new Object();
    state.reminders[i].id = reminders[i].getAttribute("role");
    state.reminders[i].text = reminders[i].children[2].innerText;
    state.reminders[i].uid = reminders[i].getAttribute("uid");
    state.reminders[i].left = reminders[i].style.left;
    state.reminders[i].top = reminders[i].style.top;
  }
  state.pips = [];
  pips = document.getElementById("interactivePlane").getElementsByClassName("reminder");
  var j = 0;
  for (i = 0; i < pips.length; i++)
  {
    if (pips[i].getAttribute("stacked") == "false")
    {
      state.pips[j] = new Object();
      state.pips[j].type = pips[i].getAttribute("alignment");
      state.pips[j].left = pips[i].style.left;
      state.pips[j].top = pips[i].style.top;
      j++;
    }
  }
  return JSON.stringify(state);
}

/**
 * Load a JSON string encoding the game state onto the grimoire.
 * @param {String} state a string encoding the JSON of a game state.
 */
async function load_game_state_json(state) {
  state = JSON.parse(state);
  if (state == null) {
    loading = false;
    return;
  }
  loading = true;
  await populate_script(state.script);
  document.getElementById("script_upload_feedback").setAttribute("used", state.scriptColor);
  document.getElementById("script_options").selectedIndex = state.scriptNumber;
  document.getElementById("player_count").value = state.playercount;
  document.getElementById("body_actual").setAttribute("night", state.night);
  document.getElementById("body_actual").style.setProperty("--BG-IMG", state.background);
  // Backwards compatibility for the old category names
  const BC_CONVERT = {
    "townsfolk": "townsfolk",
    "outsider": "outsider",
    "minion": "minion",
    "demon": "demon",
    "traveler": "traveller"
  }
  for (const player of state.players) {
    if (BC_CONVERT[player.cat] != undefined) {
      player.cat = BC_CONVERT[player.cat];
    }
    spawnToken(player.role, 
               player.uid, 
               player.visibility, 
               player.cat, 
               player.viability, 
               player.left, 
               player.top, 
               player.name);
  }
  for (const reminder of state.reminders) {
    if (!reminder.text) {
      const idParts = reminder.id.split("_");
      reminder.id = idParts[0];
      reminder.text = idParts.slice(1).map(x => x[0].toUpperCase() + x.substring(1)).join(" ");
    } 
    spawnReminder(reminder.id, reminder.text, reminder.uid, reminder.left, reminder.top);
  }
  for (let i = 0; i < state.pips.length; i++) {
    dragPipLayerSpawn(state.pips[i].type, state.pips[i].left, state.pips[i].top, "false")
  }
  if (state.orientation != getOrientation()) {
    orientationChange();
  }
  loading = false;
}

/**
 * Take the game state of the grimoire and store it in local storage.
 */
function save_game_state() {
  localStorage.setItem("state", generate_game_state_json())
}

/**
 * Upload a game state JSON from the computer and load it onto the grimoire.
 */
async function game_state_upload() {
  let json = await document.getElementById("game_state_upload").files[0].text();
  load_game_state_json(json).then(() => {
    save_game_state();
  })
}

/**
 * Convert the game state into a JSON file and download it
 * to the user's computer.
 */
function download_game_state() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generate_game_state_json()));
  element.setAttribute('download', "game_state.json");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}