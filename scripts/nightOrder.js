
/**
 * The role IDs of the default fabled. 
 */
const DEFAULT_FABLED = new Set(["doomsayer", "angel", "buddhist", "hellslibrarian", "revolutionary", "fiddler", "toymaker"]);

/**
 * Open the tab assosciated withthe selected Night Order button.
 * Only one tab can be open at any time. 
 * If it's already open, close it instead. 
 * @param {String} type The ID of the Night Order tab to open or close.
 */
function toggle_night_order_buttons(type) {
  const container = document.getElementById("nightorder_button_container");

  if (container.getAttribute("nightOrder") == type) {
    // If clicked tab is open, close it.
    clear_night_order();
  } else {
    container.setAttribute("nightOrder", type);
    switch (type) {
      case "fabled":
        populate_fabled();
        break;
      case "jinx":
        populate_jinx();
        break;
      case "first":
      case "other":
        populate_night_order();
        break;
    }
  }
}

/**
 * Delete all data assosciated with all night order entries. This ensures
 * a clean slate from which new data can be added to the tab. 
 */
function clean_night_order() {
  // TODO: it should be possible to cache this data so long as the
  //  script or characters on the grimoire have not changed. 
  document.getElementById("night_order_tab_landing").innerHTML = ""
  document.getElementById("first_night").style.color = "";
  document.getElementById("other_night").style.color = "";
  document.getElementById("jinx_toggle").style.color = "";
}

/**
 * Regenerate the night order list, utilizing in-play and alive player data.
 */
async function populate_night_order() {
  // Weird tab sheanigans. Who calls this not expecting a night order?
  // TODO: determine how to remove other calls to this function not due to
  // the call in toggle_night_order_buttons. There should be a cleaner way to
  // update the order. 
  const tab = document.getElementById("nightorder_button_container").getAttribute("nightOrder");
  if (tab == "jinx") {
    populate_jinx();
    return;
  }
  clean_night_order();
  if (tab != "first" && tab != "other") return;

  const scriptKey = tab + "Night";

  const isInPlay = x => x.getAttribute("visibility") != "bluff";
  const isAlive = x => x.getAttribute("viability") == "alive";

  const tokens = Array.from(document.getElementById("token_layer").children);
  const inPlay = new Set(tokens
      .filter(x => isInPlay(x) && isAlive(x))
      .map(x => x.getAttribute("role")));
  const alive = new Set(tokens
      .filter(isInPlay)
      .map(x => x.getAttribute("role")));
  // Add custom fabled to the night order, if necessary.
  Object.values(CURRENT_SCRIPT)
      .filter(x => x["id"] != "_meta" && x["team"] == "fabled")
      .filter(x => (x[scriptKey] ?? 0) != 0)
      .map(x => x["id"])
      .forEach(x => {alive.add(x); inPlay.add(x)})
      
  
  gen_night_order_tab_info("DUSK");

  Array.from(inPlay)
      .filter(id => (roles[id][scriptKey] ?? 0) != 0)
      .sort((x, y) => roles[x][scriptKey] - roles[y][scriptKey])
      .forEach(id => gen_night_order_tab_role(roles[id], tab, !alive.has(id)));

  gen_night_order_tab_info("DAWN"); // Super scuffed, because this technically isn't true anymore.
}

/**
 * Hide the nightOrder tab, and clear its data. 
 */
function clear_night_order() {
  clean_night_order();
  document.getElementById("nightorder_button_container").setAttribute("nightOrder", "none");
}

/**
 * Enable or disable scrolling on touch. 
 * When panning the tab with a touchscreen, the elemnets within should not 
 * be toggled during the scroll.
 * @param {Boolean} enable Whether scrolling is the default behaviour currently.
 */
function nightOrderScroll(enable) {
  if (enable == "true") {
    document.getElementById("night_order_landing_container").style.pointerEvents = "all";
  } else {
    document.getElementById("night_order_landing_container").style.pointerEvents = "none";
  }
}

/**
 * Add a character's role entry to the nightOrder tab. 
 * @param {*} token_JSON the role JSON for the character to add to the night order. 
 * @param {String} night The type of night: either the firstNight or any otherNight. 
 * @param {Boolean} dead If this player is dead. 
 */
function gen_night_order_tab_role(token_JSON, night, dead) {
  var color;
  switch (token_JSON.team) {
    case "townsfolk": color = "#0033cc"; break;
    case "outsider": color = "#0086b3"; break;
    case "minion": color = "#e62e00"; break;
    case "demon": color = "#cc0000"; break;
    case "traveller": color = "#6600ff"; break;
    case "fabled": color = "#b3b300"; break;
  }
  if (dead) { 
    color = "#000000"; 
  }
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = token_JSON.id + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , " + color + ")";
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = token_JSON[night.substring(0, 5) + "NightReminder"];
  span.id = token_JSON.id + "_night_order_tab_span";
  div.appendChild(span);
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = token_JSON.image;
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + token_JSON.id + "_night_order_tab')");
  div.appendChild(img);
  document.getElementById("night_order_tab_landing").appendChild(div);
}

/**
 * Add universal information to the nightOrder tab. 
 * @param {String} info The ID for the type of info to add to the tab. 
 */
function gen_night_order_tab_info(info) {
  var default_info = {
    "MINION_INFO": "If this game does not have 7 or more players skip this.\nIf more than one Minion, they all make eye contact with each other. Show the \"This is the Demon\" card. Point to the Demon.",
    "DEMON_INFO": "If this game does not have 7 or more players skip this.\nShow the \"These are your minions\" card. Point to each Minion. Show the \"These characters are not in play\" card. Show 3 character tokens of good characters not in play.",
    "DAWN": "Wait approximately 10 seconds. Call for eyes open; immediately announce which players (if anyone) died",
    "DUSK": "Confirm all players have eyes closed. Wait approximately 10 seconds"
  };
  div = document.createElement("div");
  div.classList = "night_order_tab";
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = "assets/" + info + ".png"
  div.appendChild(img);
  div.id = info + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , #999999)";
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + info + "_night_order_tab')");
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = default_info[info];
  span.id = info + "_night_order_tab_span";
  div.appendChild(span);
  document.getElementById("night_order_tab_landing").appendChild(div);
}

/**
 * Expand an entry in the nightOrder tab, showing its inner data 
 * (the night action reminder) to the user. 
 * @param {String} id The ID of the tab to be expanded. 
 */
function expand_night_order_tab(id) {
  tab = document.getElementById(id)
  tab.style.width = "500px";
  tab.style.transform = "translateX(-410px)";
  tab.style.height = document.getElementById(id).scrollHeight;
  tab.setAttribute("onclick", "javascript:collapse_night_order_tab(event, '" + id + "')");
  if (tab.getElementsByClassName("night_order_fabled_token_container").length == 1 && tab.getElementsByClassName("night_order_fabled_token_container")[0].children.length != 0) {
    let container = tab.getElementsByClassName("night_order_fabled_token_container")[0];
    document.getElementById("token_drag_" + id).style = "position: absolute; height: 80px; left: " + container.offsetLeft + "; top: " + container.offsetTop + ";";
    var tokens = tab.getElementsByClassName("night_order_fabled_token_container")[0].children;
  }
}
/**
 * Collapse an entry in the nightOrder tab. 
 * @param {Event} event The click or tap that triggered this collapse. 
 * @param {*} id The ID of the tab to be collapsed.
 */
function collapse_night_order_tab(event, id) {
  event.preventDefault()
  if (document.elementFromPoint(event.clientX, event.clientY).classList == "night_order_fabled_token_perm") { 
    // "bad implementation" to prevent the element from collapsing 
    // if the user is spawning a fabled reminder token.
    return; 
  } 
  tab = document.getElementById(id)
  tab.style.width = "90px";
  tab.style.transform = "translateX(0px)";
  tab.style.height = "90px";
  tab.setAttribute("onclick", "javascript:expand_night_order_tab('" + id + "')")
}

/**
 * Populate the Jinxes tab. 
 * Jinxes appear if and only if both of the characters involved in the jinx
 * are on-screen currently.
 */
async function populate_jinx() {
  clean_night_order();
  jinxes = await get_JSON("jinx.json");
  tokens = document.getElementById("token_layer").children;
  var inPlay = new Set();
  for (i = 0; i < tokens.length; i++) {
    var id = tokens[i].getAttribute("role");
    if (tokens[i].getAttribute("visibility") != "bluff") { inPlay.add(id); }
  }

  for (const char1 of inPlay) {
    const jinxList = roles[char1].jinx
    if (jinxList === undefined) continue;

    for (entry of jinxList) {
      const char2 = entry.id
      if (!inPlay.has(char2)) continue;

      gen_jinxes_tab(char1, char2, entry.reason)
    }
  }
}

/**
 * Generate an entry in the Jinxes tab. 
 * @param {String} id1 The ID of the first jinxed character.
 * @param {String} id2  The ID of the second jinxed character.
 * @param {String} reason The reason behind the jinx
 */
function gen_jinxes_tab(id1, id2, reason) {
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = id1 + "_" + id2 + "_jinx_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , #b3b300)";
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = reason;
  span.id = id1 + "_" + id2 + "_jinx_tab_span";
  div.appendChild(span);
  imgDiv = document.createElement("div");
  imgDiv.classList = "night_order_img"
  img1 = document.createElement("img");
  img1.src = roles[id1].image;
  img1.style = "width: 70%; position: absolute; top: 0px; left: 0px"
  img2 = document.createElement("img");
  img2.src = roles[id2].image;
  img2.style = "width: 70%; position: absolute; bottom: 0px; right: 0px"
  imgDiv.appendChild(img1);
  imgDiv.appendChild(img2);
  div.appendChild(imgDiv);
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + id1 + "_" + id2 + "_jinx_tab" + "')");
  document.getElementById("night_order_tab_landing").appendChild(div);
}

/**
 * Populate the Fabled tab. 
 * Fabled appear if they are either in the DEFAULT_FABLED set, 
 * or are explicilty listed in the CURRENT_SCRIPT. 
 */
function populate_fabled() {
  clean_night_order();
  var fabled = DEFAULT_FABLED;
  CURRENT_SCRIPT.forEach((entry) => {
    if (entry.id != "_meta") {
      var token = roles[entry.id];
      if (token["team"] == "fabled") {
        fabled.add(entry.id);
      }
    }
    return Promise.resolve();
  })
  fabled.forEach((fable) => {
    var json = roles[fable];
    gen_fabled_tab(json, true);
    return Promise.resolve();
  })
}

/**
 * Generate an entry in the Fabled tab. 
 * @param {*} token_JSON The role JSON of the fabled to add.
 * @param {*} inPlay whether the Fabled is in play
 */
function gen_fabled_tab(token_JSON, inPlay) {
  var color = "#b3b300";
  // TODO: inPlay is always true. Determine its applicability. 
  if (!inPlay) { color = "#000000"; }
  var div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = token_JSON.id + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , " + color + ")";

  var span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = token_JSON["ability"];
  span.id = token_JSON.id + "_night_order_tab_span";
  div.appendChild(span);

  var img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = token_JSON.image;
  div.appendChild(img);

  var token_landing = document.createElement("div");
  token_landing.classList = "night_order_fabled_token_container"
  token_landing.id = "night_order_" + token_JSON.id;
  const allReminders = (token_JSON["reminders"] ?? []).concat(token_JSON["remindersGlobal"] ?? []);
  new Set(allReminders).forEach((token) => {
    var uid = makeUid();
    var token_perm = generateReminderBacking(token_JSON.id, token, uid)
    token_perm.id = `${token_JSON.id}_${token}`;
    token_perm.setAttribute("onclick", `javascript:spawnFabledReminder("${token_JSON.id}", "${token}")`)
    token_landing.appendChild(token_perm)
  })
  div.appendChild(token_landing);
  var token_drag = document.createElement("div");
  token_drag.id = "token_drag_" + token_JSON.id + "_night_order_tab";
  div.appendChild(token_drag);
  document.getElementById("night_order_tab_landing").appendChild(div);
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + token_JSON.id + "_night_order_tab')");
}