
const UID_LENGTH = 13
const DEFAULT_FABLED = new Set(["doomsayer", "angel", "buddhist", "hellslibrarian", "revolutionary", "fiddler", "toymaker"]);
var base_roles;
var roles;
var loading = false;
var CURRENT_SCRIPT;
// ? TODO better scripts menu
// TODO fullscreeen settings menu
// TODO better fabled tokens
// ? TODO pip layer clean up prompt delete
// TODO clean up saving and loading 
// * TODO fancify night widget
// * TODO higher player limit to include travellers




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
