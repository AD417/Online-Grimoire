
const UID_LENGTH = 13
const DEFAULT_FABLED = new Set(["doomsayer", "angel", "buddhist", "hellslibrarian", "revolutionary", "fiddler", "toymaker"]);
var base_roles;
var roles;
var loading = false;
var CURRENT_SCRIPT;
var night_order_ref;
// ? TODO better scripts menu
// TODO fullscreeen settings menu
// TODO better fabled tokens
// ? TODO pip layer clean up prompt delete
// TODO clean up saving and loading 
// * TODO fancify night widget
// * TODO higher player limit to include travellers



async function get_JSON(path)
{
  return await (await fetch("./data/" + path)).json();
}

function background_image_change(file_name)
{
  document.getElementById("body_actual").style.setProperty("--BG-IMG", "url('assets/backgrounds/" + file_name + ".webp')");
  if (!loading) { save_game_state(); }
}

function getOrientation()
{
  if (window.innerHeight > window.innerWidth)
  {
    return "portrait";
  } else
  {
    return "landscape";
  }
}
function resized()
{
  if (document.getElementById("body_actual").getAttribute("orientation") != getOrientation())
  {
    orientationChange();
  }
  document.getElementById("body_actual").setAttribute("orientation", getOrientation());
}
function swapObjectOrientation(HTMLobj)
{
  tmp = HTMLobj.style.top;
  HTMLobj.style.top = HTMLobj.style.left;
  HTMLobj.style.left = tmp;
}
function orientationChange()
{
  players = document.getElementById("token_layer").getElementsByClassName("role_token");
  for (i = 0; i < players.length; i++)
  {
    swapObjectOrientation(players[i]);
  }
  reminders = document.getElementById("remainerLayer").getElementsByClassName("reminder");
  for (i = 0; i < reminders.length; i++)
  {
    swapObjectOrientation(reminders[i]);
  }
  pips = document.getElementById("interactivePlane").getElementsByClassName("reminder");
  for (i = 0; i < pips.length; i++)
  {
    if (pips[i].getAttribute("stacked") == "false")
    {
      swapObjectOrientation(pips[i]);
    }
  }
}

async function loaded()
{
  loading = true;
  base_roles = await get_JSON("tokens.json");
  // Make a copy...
  roles = JSON.parse(JSON.stringify(base_roles));

  // Add unreleased experimental, as a failsafe backwards compatibility
  const unreleased = await get_JSON("scripts/Unreleased Experimental.json")
  for (const role of unreleased) {
    const id = role.id.split("_", 2)[0];
    if (id == "") continue;
    role.id = id;
    roles[id] = role;
  }

  dragPipLayerSpawnDefault("good");
  dragPipLayerSpawnDefault("evil");
  dragPipLayerSpawnDefault("reminder_pip");
  load_scripts().then(() =>
  {
    load_game_state_json(localStorage.getItem("state"))
  })
  setTimeout(function ()
  {
    loading = false;
    player_count_change();
  }, 2000)
  document.getElementById("body_actual").setAttribute("orientation", getOrientation())
  window.onresize = resized;
}

// corner toggles and night functions
function visibility_toggle()
{
  tokens = document.getElementById("token_layer").getElementsByClassName("role_token");
  if (document.getElementById("body_actual").getAttribute("night") == "false")
  { // ! nighttime
    document.getElementById("body_actual").setAttribute("night", "true");
    for (i = 0; i < tokens.length; i++)
    {
      var id = tokens[i].getAttribute("role");
      var uid = tokens[i].getAttribute("uid");
      tokens[i].style.backgroundImage = "";
      tokens[i].setAttribute("onclick", "javascript:deathCycle('" + id + "', " + uid + ")");
    }
  } else
  {                                                                     // ! daytime
    document.getElementById("body_actual").setAttribute("night", "false");
    for (i = 0; i < tokens.length; i++)
    {
      var id = tokens[i].getAttribute("role");
      var uid = tokens[i].getAttribute("uid");
      tokens[i].style.backgroundImage = "url('assets/token.png')"
      tokens[i].setAttribute("onclick", "javascript:infoCall('" + id + "', " + uid + ")");
    }
  }
  clear_night_order();
}
function deathCycle(id, uid)
{
  let token = document.getElementById(id + "_token_" + uid);
  switch (token.getAttribute("viability"))
  {
    case "alive": //toDeadVote
      token.setAttribute("viability", "dead_vote");
      break;
    case "dead_vote": //toDead
      token.setAttribute("viability", "dead");
      break;
    case "dead": // toAlive
      token.setAttribute("viability", "alive");
      break;
    default: token.setAttribute("viability", "alive");
  }
  populate_night_order();
  if (!loading) { save_game_state(); }
}
function move_toggle()
{
  var self = document.getElementById("move_toggle")
  if (self.style.backgroundColor == "green")
  {
    self.style.backgroundColor = "rgb(66, 66, 66)";
  } else
  {
    self.style.backgroundColor = "green";
  }
}



function clean_tokens(uid)
{
  let reminders = document.getElementById("remainerLayer").getElementsByClassName("reminder");
  for (i = reminders.length - 1; i != -1; --i)
  {
    if (reminders[i].getAttribute("uid").substring(0, UID_LENGTH) == uid)
    {
      document.getElementById("remainerLayer").removeChild(reminders[i]);
    }
  }
}

function shuffle_roles()
{
  if (document.getElementById("body_actual").getAttribute("night") == "true") { visibility_toggle() }
  function shuffle(a)
  {
    for (let i = a.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    hideInfo();
  }
  let tokens = document.getElementById("token_layer").children;
  var ids = [];
  for (i = 0, j = 0; i < tokens.length; i++)
  {
    if (tokens[i].getAttribute("visibility") == "show")
    {
      ids[j++] = tokens[i].id.match(/.*(?=_token_)/)[0];
    }
  }
  shuffle(ids);
  var offset = 0
  for (let i = 0, j = 0; i < tokens.length; i++)
  {
    if (tokens[i].getAttribute("visibility") == "show")
    {
      mutate_token(tokens[i].id.match(/.*(?=_token_)/)[0], tokens[i].getAttribute("uid"), ids[j++]);
    }
  }
}




//menu functions
function open_menu()
{
  document.getElementById("menu_main").style.transform = "translateX(0px)";
}
function close_menu()
{
  document.getElementById("menu_main").style.transform = "translateX(-300px)";
}
async function load_scripts()
{
  var scripts = await get_JSON("scripts/scripts.json")
  var initScript;
  for (i = 0; i < scripts.length; i++)
  {
    var element = scripts[i]
    var script = await get_JSON("scripts/" + element["file"] + ".json");
    if (i == 0) { initScript = script; }
    option = document.createElement("option");
    optionText = document.createTextNode(script[0]["name"]);
    option.appendChild(optionText);
    document.getElementById("script_options").appendChild(option);
  }
  populate_script(initScript)
}
async function script_select()
{
  var script_names = await get_JSON("scripts/scripts.json");
  var script = await get_JSON("scripts/" + script_names[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
  document.getElementById("script_upload_feedback").setAttribute("used", "select");
  document.getElementById("script_upload").value = "";
  populate_script(script);
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}
async function script_upload()
{
  let json = JSON.parse(await document.getElementById("script_upload").files[0].text());
  // Pre-integration check for reeeeeally old scripts.
  for (var i = 0; i < json.length; i++)
  {
    if (typeof json[i] == typeof "")
    {
      json[i] = { "id": json[i] };
    }
  }
  try
  {
    json[0]["id"];
    populate_script(json);
    document.getElementById("script_upload_feedback").setAttribute("used", "upload");
  } catch (e) {
    console.error(e);
    document.getElementById("script_upload_feedback").innerHTML = "Error Processing File";
    document.getElementById("script_upload_feedback").setAttribute("used", "error");
  }
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}
async function populate_script(script)
{
  CURRENT_SCRIPT = script;
  document.getElementById("script_upload_feedback").innerHTML = script[0]["name"];
  function header(text, landing_name, color)
  {
    var div = document.createElement("div");
    div.innerHTML = text;
    div.style.color = color;
    div.classList = "menu_header"
    const landing = document.getElementById(landing_name)
    landing.appendChild(div);
    var ratio = document.createElement("div");
    ratio.classList = "menu_ratio";
    ratio.innerHTML = "0/0";
    ratio.id = "ratio_" + landing_name
    landing.appendChild(ratio);
    landing.insertAdjacentHTML("beforeend", "<hr style='margin-block-end: 0em;'>");
  }
  function options(type, tokenNames, text)
  {
    var landing = document.getElementById(type)
    for (i = 0; i < tokenNames.length; i++)
    {
      var tokenJSON = tokenNames[i];
      if (tokenJSON.team == type)
      {
        var outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = tokenJSON["ability"];
        outer_div.setAttribute("onclick", `javascript:spawnTokenDefault('${tokenJSON["id"]}', 'show', '${tokenJSON["team"]}')`);
        var label = document.createElement("label");
        label.classList = "menu_list";
        label.innerHTML = tokenJSON["name"];
        outer_div.appendChild(label);
        var count_div = document.createElement("div");
        count_div.classList = "menu_token_count";
        count_div.innerHTML = 0;
        count_div.id = tokenJSON["id"] + "_count";
        outer_div.appendChild(count_div);
        outer_div.insertAdjacentHTML("beforeend", "&nbsp;");
        var hr = document.createElement("hr");
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);
        landing.appendChild(outer_div)
      }
    }
    //edit by @The-ai123
    //Add button to add offscreen of each category
    var outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = title="Add offscript " + text;
        outer_div.setAttribute("onclick", "add_offscript_character('"+ type +"')");
        var label = document.createElement("label");
        label.classList = "menu_list";
        label.innerHTML = "Add Offscript " + text;
        outer_div.appendChild(label);
        outer_div.insertAdjacentHTML("beforeend", "&nbsp;");
        var hr = document.createElement("hr");
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);
        landing.appendChild(outer_div)
  }
  function clear(div)
  {
    document.getElementById(div).innerHTML = ""
  }
  let scriptTokens = [];
  script.forEach(element =>
  {
    if (element.id == "_meta") return;
    console.log(element.id)
    // More complex things have more than an ID.
    if (Object.keys(element).length > 1) {
      roles[element.id] = element;
    }
    try { 
      scriptTokens.push(roles[element.id]) 
    } catch {}
  })

  console.log(scriptTokens)

  clear("townsfolk")
  header("Town", "townsfolk", "#0033cc")
  options("townsfolk", scriptTokens, "Town")
  clear("outsider")
  header("Outsiders", "outsider", "#1a53ff")
  options("outsider", scriptTokens, "Outsiders")
  clear("minion")
  header("Minions", "minion", "#b30000")
  options("minion", scriptTokens, "Minions")
  clear("demon")
  header("Demons", "demon", "#e60000")
  options("demon", scriptTokens, "Demons")
  clear("traveller")
  header("Travellers", "traveller", "#6600ff")
  options("traveller", scriptTokens, "Travellers")
  player_count_change();
  update_role_counts();
  clear_mutate_menu();
  populate_mutate_menu(scriptTokens);

  if (!loading) { save_game_state(); }
  return Promise.resolve()
}
function increment_player_count(x)
{
  document.getElementById("player_count").value = parseInt(document.getElementById("player_count").value) + parseInt(x);
  player_count_change()
}
function player_count_change()
{
  var player_count_tmp = document.getElementById("player_count").value;
  tableIndex = 0;
  if (player_count_tmp < 5)
  {
    document.getElementById("player_count").value = 5;
    player_count_tmp = 5
  }
  let player_count = player_count_tmp;
  if (player_count_tmp > 15)
  {
    player_count_tmp = 15
  }
  tableIndex = parseInt(player_count_tmp) - 5;
  var table = [
    [3, 0, 1, 1], 
    [3, 1, 1, 1], 
    [5, 0, 1, 1], 
    [5, 1, 1, 1], 
    [5, 2, 1, 1], 
    [7, 0, 2, 1], 
    [7, 1, 2, 1], 
    [7, 2, 2, 1], 
    [9, 0, 3, 1], 
    [9, 1, 3, 1], 
    [9, 2, 3, 1], 
    [10, 2, 3, 1], 
    [11, 2, 3, 1], 
    [11, 3, 3, 1]
  ]
  var counts = [0, 0, 0, 0, 0];
  tokens = document.getElementsByClassName("role_token");
  if (loading) return;


  //dont try to update player counts before menu is loaded
  var expected = new Object();
  const TYPES = ["townsfolk", "outsider", "minion", "demon", "traveller"];
  for (let i = 0; i < 4; i++) {
    // [hard modifier, soft positive modifier, soft negative modifier, locked?]
    expected[TYPES[i]] = [table[tableIndex][i], 0, 0, false];
  }
  expected.traveller = [0, 0, 0, false];
  async function makeupMod(id)
  {
    try
    {
      let lambdas = {
        "HARD": ((cat, mod) => { expected[cat][0] += mod }),
        "SOFTPOS": ((cat, mod) => { expected[cat][1] += mod }),
        "SOFTNEG": ((cat, mod) => { expected[cat][2] += mod }),
        "REQ": ((cat, val) => { }),
        "LOCK": ((cat, val) =>
        {
          if (val == -1)
          {
            expected[cat][0] = player_count;
          } else
          {
            expected[cat][0] = val;
          }
          expected[cat][3] = true;
          expected[cat][1] = 0;
          expected[cat][2] = 0;
        })
      }
      let json = roles[id];
      json["change_makeup"].forEach(element =>
      {
        let changeKey = Object.keys(element)[0];
        if (!expected[element[changeKey][0]][3])
        {
          lambdas[changeKey](element[changeKey][0], element[changeKey][1]);
        }
      });
    } catch { }
    return Promise.resolve();
  }
  for (i = 0; i < tokens.length; i++)
  {
    let visibility = tokens[i].getAttribute("visibility");
    switch (tokens[i].getAttribute("cat"))
    {
      case "townsfolk":
        if (visibility == "show") { counts[0]++; }
        break;
      case "outsider":
        if (visibility == "show") { counts[1]++; }
        break;
      case "minion":
        if (visibility == "show") { counts[2]++; }
        break;
      case "demon":
        if (visibility == "show") { counts[3]++; }
        break;
      case "traveller":
        if (visibility == "show") { counts[4]++; }
        break;
    }
  }
  for (i = 0; i < tokens.length; i++)
  {
    makeupMod(tokens[i].id.match(/.*(?=_token_)/)[0])
  }
  function genSoftModString(pos, neg)
  {
    var string = " "
    var combined = 0;
    while (pos > 0 && neg > 0)
    {
      combined++;
      pos--;
      neg--;
    }
    if (combined > 0)
    {
      string += String.fromCharCode(177) + combined;
    }
    if (pos > 0)
    {
      string += " +" + pos;
    }
    if (neg > 0)
    {
      string += " -" + neg;
    }
    return string;
  }
  if (player_count > 15 && !expected["trav"][3]) { expected["trav"][0] += player_count - 15 }
  for (let i = 0; i < 5; i++) {
    const team = TYPES[i];
    const teamCount = expected[team];
    const softmod = genSoftModString(teamCount[1], teamCount[2])

    const ratio = document.getElementById(`ratio_${team}`);
    ratio.innerHTML = `${teamCount[0]}/${teamCount[0]}${softmod}`;
  }
}
function update_role_counts()
{
  var counts = document.getElementsByClassName("menu_token_count");
  for (let i = 0; i < counts.length; i++)
  {
    counts[i].innerHTML = 0;
  }
  var tokens = document.getElementsByClassName("role_token");
  for (let i = 0; i < tokens.length; i++)
  {
    id = tokens[i].getAttribute("id").match(/.*(?=_token)/)[0];
    try
    {
      if (tokens[i].getAttribute("visibility") == "show")
      {
        document.getElementById(id + "_count").innerHTML = parseInt(document.getElementById(id + "_count").innerHTML) + 1;
      }
    }
    catch (e) { }

  }

}

function toggle_menu_collapse()
{
  const dropdown = document.getElementById("menu_settings_dropdown");
  if (dropdown.getAttribute("expand") == "true")
  {
    dropdown.setAttribute("expand", "false");
    dropdown.style.height = "40px";
  } else
  {
    dropdown.setAttribute("expand", "true");
    dropdown.style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  }
}
function clean_board()
{
  const tokens = document.getElementById("token_layer").children;
  for (let it = tokens.length - 1; it >= 0; it--)
  {
    remove_token(tokens[it].id.match(/.*(?=_token_)/)[0], tokens[it].getAttribute("uid"))
  }
  const pips = document.getElementById("dragPipLayer").children;
  for (let it = pips.length - 1; it >= 0; it--)
  {
    if (pips[it].getAttribute("stacked") == "false")
    {
      delete_reminder(pips[it].id);
    }
  }
  clear_night_order();
  save_game_state();
}
function change_background_menu()
{
  document.getElementById("background_select_menu").style.display = "inherit";
}
function change_background_menu_hide()
{
  document.getElementById("background_select_menu").style.display = "none";
}

//info functions
async function infoCall(id, uid)
{
  close_menu();
  let data_token = document.getElementById(id + "_token_" + uid);
  generateSampleToken(id,  document.getElementById("info_img"));
  var roleJSON = roles[id];
  document.getElementById("info_title_field").innerHTML = roleJSON["name"];
  document.getElementById("info_name_field").innerHTML = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
  document.getElementById("info_img_name").innerHTML = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
  document.getElementById("info_desc_field").innerHTML = roleJSON["ability"];
  document.getElementById("info_flavor_field").innerHTML = `"${(roleJSON["flavor"] ?? "").replaceAll(/\n[\t ]*/g, " / ")}"`;
  document.getElementById("info_flavor_field").style.color = ["minion", "demon"].includes(roleJSON.team) ? "rgb(230, 176, 176)" : "rgb(176, 176, 230)"
  document.getElementById("info_list").setAttribute("current_player", id);
  document.getElementById("info_token_landing").innerHTML = "";
  document.getElementById("info_remove_player").setAttribute("onclick", "javascript:remove_token('" + id + "', '" + uid + "')");
  document.getElementById("info_kill_cycle").setAttribute("onclick", "javascript:info_death_cycle_trigger('" + id + "', '" + uid + "')");
  document.getElementById("info_visibility_toggle").setAttribute("onclick", "javascript:cycle_token_visibility_toggle('" + id + "', '" + uid + "')");
  document.getElementById("info_edit_role").setAttribute("onclick", "javascript:mutate_menu('" + id + "', '" + uid + "')");
  document.getElementById("info_box").setAttribute("hidden", data_token.getAttribute("visibility"));
  document.getElementById("info_name_input").value = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
  document.getElementById("info_name_input").setAttribute("onchange", "javascript:nameIn('" + id + "', " + uid + ")");
  document.getElementById("info_box").style.display = "inherit";
  document.getElementById("info_token_dragbox").innerHTML = "";

  update_info_death_cycle(id, uid);

  const landing = document.getElementById("info_token_landing");
  const allReminders = (roleJSON["reminders"] ?? []).concat(roleJSON["remindersGlobal"] ?? [])
  for (const reminder of new Set(allReminders))
  {
    const backing = generateReminderBacking(id, reminder, uid);
    // div.setAttribute("reminderId", i);
    document.getElementById("info_token_landing").appendChild(backing);

    const x = backing.getBoundingClientRect().x - landing.getBoundingClientRect().x;
    const y = backing.getBoundingClientRect().y - landing.getBoundingClientRect().y;
    // x, y, roleName, reminder info, id
    spawnReminderGhost(x, y, id, reminder, backing.id);
  }
}

function generateSampleToken(id, el) {
  el.textContent = "";

  var token = document.createElement("img");
  token.src = "assets/token.png"
  token.style.width = "100%";
  token.style.height = "100%";
  el.appendChild(token);

  var role = document.createElement("img");
  role.id = "info_img_role";
  role.style.position = "absolute";
  role.src = roles[id].image;
  el.appendChild(role);

  var roleName = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  roleName.setAttribute("viewBox", "0 0 150 150");
  roleName.classList.add("token_role_name");
  
  // Curvature
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M 13 75 C 13 150, 138 150, 138 75");
  path.setAttribute("id", "curve");
  path.setAttribute("fill", "transparent");
  roleName.appendChild(path);
  
  // Text
  var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("width", "150");
  text.setAttribute("x", "62.5%");
  text.setAttribute("y", "130");
  text.setAttribute("text-anchor", "middle");
  
  // Create the textPath element
  var textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
  textPath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#curve");
  textPath.setAttribute("style", "fill: black; font-family: Dumbledor; font-size: 24px;");
  textPath.classList.add("js--character--name");
  textPath.textContent = roles[id]["name"]; 
  
  text.appendChild(textPath);
  roleName.appendChild(text);
  el.appendChild(roleName);

  return el;
}

function hideInfo()
{
  document.getElementById("info_box").style.display = "none";
}

function nameIn(id, uid)
{
  let value = document.getElementById("info_name_input").value;
  document.getElementById(id + "_name_" + uid).innerHTML = value;
  document.getElementById("info_name_field").innerHTML = value;
  document.getElementById("info_img_name").innerHTML = value;
}

function cycle_token_visibility_toggle(id, uid)
{
  switch (document.getElementById(id + "_token_" + uid).getAttribute("visibility"))
  {
    case "show":
      document.getElementById(id + "_token_" + uid).setAttribute("visibility", "bluff");
      document.getElementById("info_box").setAttribute("hidden", "bluff");
      break;
    case "bluff":
      document.getElementById(id + "_token_" + uid).setAttribute("visibility", "hide");
      document.getElementById("info_box").setAttribute("hidden", "hide");
      break;
    case "hide":
      document.getElementById(id + "_token_" + uid).setAttribute("visibility", "show");
      document.getElementById("info_box").setAttribute("hidden", "show");
      break;
  }
  update_role_counts();
  player_count_change();
  populate_night_order();
  if (!loading) { save_game_state(); }
}

function expand_info_tab(tab)
{
  document.getElementById("info_desc").setAttribute("focus", "false");
  document.getElementById("info_list").setAttribute("focus", "false");
  document.getElementById("info_rmnd").setAttribute("focus", "false");
  document.getElementById("info_powr").setAttribute("focus", "false");
  document.getElementById("info_rmnd").style.overflow = "hidden";
  switch (tab)
  {
    case 'desc':
      document.getElementById("info_desc").setAttribute("focus", "true");
      break;
    case 'list':
      document.getElementById("info_list").setAttribute("focus", "true");
      break;
    case 'rmnd':
      document.getElementById("info_rmnd").setAttribute("focus", "true");
      setTimeout((() => { document.getElementById("info_rmnd").style.overflow = "visible"; }), 200) // because overflow needs to be visible/ delays until after animation
      break;
    case 'powr':
      document.getElementById("info_powr").setAttribute("focus", "true");
      break;
  }
}

function info_death_cycle_trigger(id, uid)
{
  deathCycle(id, uid);
  update_info_death_cycle(id, uid);

}

function update_info_death_cycle(id, uid)
{
  switch (document.getElementById(id + "_token_" + uid).getAttribute("viability"))
  {
    case "alive":
      document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/tombstone.png')"
      break;
    case "dead_vote":
      document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/vote.png')"
      break;
    case "dead":
      document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/revive.png')"
      break;
  }
}

function load_playerinfo_shroud(typeId)
{
  function mapped_specials(typeId)
  {
    switch (typeId)
    {
      case 2:
        var bluffs = [];
        var tokens = document.getElementById("token_layer").children;
        for (i = 0; i < tokens.length; i++)
        {
          if (tokens[i].getAttribute("visibility") == "bluff")
          {
            bluffs.push(tokens[i].id.match(/.*(?=_token_)/)[0])
          }
        }
        var places = document.getElementById("playerinfo_character_landing").children
        for (i = 0; i < places.length; i++)
        {
          if (bluffs.length != 0)
          {
            select_playerinfo_character(i, bluffs.pop())
          }
        }
        break;
      case 5:
        select_playerinfo_character(0, document.getElementById("info_list").getAttribute("current_player"));
        break;
      case 10:
        var input = document.createElement("textarea");
        function recalcHeight()
        {
          document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";
        }
        new ResizeObserver(recalcHeight).observe(input);
        input.id = "playerinfo_input"
        input.value = "You learn..."
        document.getElementById("playerinfo_character_landing").prepend(document.createElement("br"));
        document.getElementById("playerinfo_character_landing").prepend(input);
        document.getElementById("playerinfo_character_landing").prepend(document.createElement("br"));
        break;
    }
  }
  let cards = {
    0: { "title": "Use Your Ability?", "players": 0 },
    1: { "title": "Choose a Player", "players": 0 },
    2: { "title": "These Characters are Not In Play", "players": 3 },
    3: { "title": "This Is Your Demon", "players": 0 },
    4: { "title": "These Are Your Minions", "players": 0 },
    5: { "title": "You Are", "players": 1 },
    6: { "title": "This Player Is", "players": 1 },
    7: { "title": "Character Selected You", "players": 1 },
    8: { "title": "Did You Vote Today?", "players": 0 },
    9: { "title": "Did You Nominate Today?", "players": 0 },
    10: { "title": "Info", "players": 3 },
    11: { "title": "Make your Choice", "players": 1 },
    12: { "title": "Make your Choices", "players": 2 },
    13: { "title": "Make your Choices", "players": 3 }
  }
  document.getElementById("playerinfo_shoud").style.display = "inherit";
  document.getElementById("playerinfo_title").innerHTML = cards[typeId]["title"];
  document.getElementById("playerinfo_character_landing").innerHTML = "";
  for (i = 0; i < cards[typeId]["players"]; i++)
  {
    var div = document.createElement("div");
    div.id = "playerinfo_character_" + i;
    div.classList = "playerinfo_character";
    div.setAttribute("onclick", "javascript:trigger_playerinfo_character_select(" + i + ")")
    document.getElementById("playerinfo_character_landing").appendChild(div);
  }
  mapped_specials(typeId);
  document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";
}

function trigger_playerinfo_character_select(id)
{
  const types = ["townsfolk", "outsider", "minion", "demon", "traveller", "fabled"];
  for (const type of types) {
    const tokens = document.getElementById(`mutate_menu_${type}`).children;
    for (const token of tokens) {
      const matcher = token.id.match(/(?<=mutate_menu_).*/);
      token.setAttribute("onclick", `select_playerinfo_character('${id}', '${matcher}')`);
    }
  }
  // Show mutate menu
  document.getElementById("mutate_menu_main").style.display = "inherit";
}

function select_playerinfo_character(id, selection)
{
  const div = document.createElement("div");
  generateSampleToken(selection, div);

  div.style.position = "absolute";
  div.style.left = 25;
  div.style.width = 300;
  div.style.height = 300;

  document.getElementById("playerinfo_character_" + id).innerText = "";
  document.getElementById("playerinfo_character_" + id).appendChild(div);
}

function close_playerinfo_shroud()
{
  document.getElementById("playerinfo_shoud").style.display = "none";
}
