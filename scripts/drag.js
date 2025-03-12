// NOSHIP: Reject this PR. I am assuming that this file will be overhauled and made redundant by PR #53. 
//drag functions
var active;
function dragInit()
{
  const dragSpots = document.getElementsByClassName("drag");
  for (var i = 0; i < dragSpots.length; i++)
  {
    var container = dragSpots[i];

    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);

    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  }
}
function dragStart(e)
{
  if (document.getElementById("move_toggle").style.backgroundColor != "green" && isRoleToken(e.target)) { return }
  const token = getActualDragged(e.target);
  var pos = getComputedStyle(token)
  if (e.type === "touchstart")
  {
    xOffset = e.touches[0].clientX - pos.getPropertyValue('left').match(/\d+/)[0];
    yOffset = e.touches[0].clientY - pos.getPropertyValue('top').match(/\d+/)[0];
  } else
  {
    xOffset = e.clientX - pos.getPropertyValue('left').match(/\d+/)[0];
    yOffset = e.clientY - pos.getPropertyValue('top').match(/\d+/)[0];
  }
  if (token.classList.contains("drag"))
  {
    active = true;
  }
}
function dragEnd(e)
{
  const el = e.target;
  // The good, evil, and generic reminder tokens.
  if (el.getAttribute("disposable-reminder"))
  {
    if (el.getAttribute("stacked") == "true")
    {
      dragPipLayerSpawnDefault(el.getAttribute("alignment"));
    }
    el.setAttribute("stacked", false);
    el.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + el.id + "')");
    el.style.cursor = "pointer";
  }
  
  // If a new reminder token is to be instantiated.
  if (el.getAttribute("ghost") == "true")
  {
    const role = el.getAttribute("role");
    const reminder = el.children[2].innerText;
    spawnReminder(
        role,
        reminder,
        //el.id.substring(5, e.target.id.length - (2 * UID_LENGTH) - 2), 
        el.id.substring(e.target.id.length - (2 * UID_LENGTH) - 1, e.target.id.length), 
        el.getBoundingClientRect().left + 12.5, 
        e.target.getBoundingClientRect().top + 12.5
    );
    if (e.target.getAttribute("token_from") == "info")
    {
      let x = document.getElementById(el.id.substring(0, e.target.id.length - UID_LENGTH - 1)).getBoundingClientRect().x - document.getElementById("info_token_landing").getBoundingClientRect().x;
      let y = document.getElementById(el.id.substring(0, e.target.id.length - UID_LENGTH - 1)).getBoundingClientRect().y - document.getElementById("info_token_landing").getBoundingClientRect().y;
      // SCUFFED AF
      spawnReminderGhost(
          x, 
          y, 
          role,
          reminder,
          e.target.id.substring(0, e.target.id.length - UID_LENGTH - 1)
      );
    }// else if (e.target.getAttribute("token_from") == "night_order") {
    //   let x = document.getElementById("night_order_" + e.target.id.substring(0, e.target.id.length-UID_LENGTH-1))
    //   let y = document.getElementById("night_order_" + e.target.id.substring(0, e.target.id.length-UID_LENGTH-1))
    //   spawnNightOrderGhost(x, y, e.target.style.backgroundImage, e.target.id.substring(0, e.target.id.length-UID_LENGTH-1));
    // }
    e.target.parentNode.removeChild(e.target);
  }
  active = false;
  if (!loading) { save_game_state(); }
}
function drag(e)
{
  if (active)
  {

    e.preventDefault();
    let moved = e.target;

    while (moved.localName != "html" && moved.localName != "div") {
      moved = moved.parentElement;
    }
    //if (!moved.classList.contains("role_token")) return;

    if (e.type === "touchmove")
    {
      currentX = e.touches[0].clientX - xOffset;
      currentY = e.touches[0].clientY - yOffset;
    } else
    {
      currentX = e.clientX - xOffset;
      currentY = e.clientY - yOffset;
    }

    setTranslate(currentX, currentY, moved);
  }
}
function setTranslate(xPos, yPos, el)
{
  el.style.left = xPos + "px"
  el.style.top = yPos + "px"
}

function getActualDragged(el) {
  let root = el;
  while (root.localName != "body") {
    if (root.classList.contains("role_token")) return root;
    root = root.parentElement;
  }
  return el;
}

function isRoleToken(el) {
  while (el.localName != "body") {
    if (el.classList.contains("role_token")) return true;
    el = el.parentElement;
  }
  return false;
}


//if you click on black space
function neutralClick()
{
  active = false;
  hideInfo()
  close_menu()
  unprompt_reminders()
}
