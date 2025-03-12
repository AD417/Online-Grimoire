/**
 * A list of all of the roles that this grimoire Utility currently knows about. 
 * Roles can be added to this list in one of three ways: 
 * 
 * 1. Being a part of the tokens.json file, the source of truth for official 
 * BOTC characters.
 * 
 * 2. Being part of the script used according to the currently saved gamestate.
 * 
 * 3. The user uploading a script containing a desired role.
 * 
 * Roles added persist until the page is reloaded, at which point points
 * 1 and 2 will add their roles back. By importing multiple scripts, it's
 * possible to mix and match roles from multiple homewbrew scripts.
 * 
 * The roles conform to a format as specified by the BOTC developers at
 * https://github.com/ThePandemoniumInstitute/botc-release/blob/main/README.md.
 */
var roles = {};
/**
 * A list of all of the official roles this grimoire utility knows about. 
 * Roles can only be added to this list via inclusion in tokens.json,
 * the source of truth for official BOTC characters.
 */
var base_roles = {};

/**
 * Whether the application is loading. Set to true for the first few seconds
 * of application loading as data is synced from the server, or when loading
 * an uploaded gamestate from the grimoire. Saving is not possible while 
 * loading is occuring.
 */
var loading = false;

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
  load_scripts().then(() => {
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
