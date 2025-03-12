
/**
 * Get a JSON file from the server.
 * @param {String} path A relative path to the file on the server.
 * @returns the JSON string from that file. 
 */
async function get_JSON(path) {
  return await (await fetch("./data/" + path)).json();
}

/**
 * Load all of the scripts from the server. 
 */
async function load_scripts() {
  var scripts = await get_JSON("scripts/scripts.json")
  var initScript;
  for (i = 0; i < scripts.length; i++) {
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

/**
 * Initialize the selected script from the script_options dropdown.
 */
async function script_select() {
  var script_names = await get_JSON("scripts/scripts.json");
  var script = await get_JSON("scripts/" + script_names[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
  document.getElementById("script_upload_feedback").setAttribute("used", "select");
  document.getElementById("script_upload").value = "";
  populate_script(script);
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}

/**
 * Upload a script to the Grimoire.
 */
async function script_upload() {
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

/**
 * Given a JSON script, populate the side menu with the various characters
 * listed in the script. 
 * @param {Object} script a container with all of the characters in the script
 */
async function populate_script(script) {
  CURRENT_SCRIPT = script;
  document.getElementById("script_upload_feedback").innerHTML = script[0]["name"];
  function header(text, landing_name, color) {
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
    // More complex things have more than an ID.
    if (Object.keys(element).length > 1) {
      roles[element.id] = element;
    }
    try { 
      scriptTokens.push(roles[element.id]) 
    } catch {}
  })

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