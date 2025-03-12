
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
