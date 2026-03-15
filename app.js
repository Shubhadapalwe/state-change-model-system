// =======================================================
// Slideshow Builder — app.js
// =======================================================
//
// This JavaScript file controls the complete logic of the
// slideshow builder project.
//
// Main responsibilities of this file:
// 1. Manage application state (page1, page2, page3)
// 2. Store images and album data
// 3. Render tables and album slots dynamically
// 4. Handle drag-and-drop operations
// 5. Handle slideshow playback
// 6. Save and load slideshow JSON
// 7. Save and load UI layout JSON
// 8. Support Edit UI mode for moving/resizing buttons
//
// The comments are intentionally very detailed so that
// a teacher can understand:
// - meaning of each variable
// - why each function exists
// - what each section is doing internally
// =======================================================



// =======================================================
// APPLICATION STATES
// =======================================================
//
// This object stores all valid logical states/pages
// of the application.
//
// Why needed:
// Instead of writing raw strings repeatedly,
// we define them in one place for clarity and safety.
const State = {
  PAGE1: "PAGE1",   // Image loading and preview page
  PAGE2: "PAGE2",   // Album builder page
  PAGE3: "PAGE3"    // Slideshow playback page
};


// This variable stores the current active application state.
//
// Initial value is PAGE1 because user starts from loading images.
let currentState = State.PAGE1;



// =======================================================
// MAIN DATA VARIABLES
// =======================================================

// This array stores all images loaded by the user.
//
// Each element is an object like:
// {
//   id: unique id,
//   name: original file name,
//   type: file MIME type,
//   size: file size,
//   dataUrl: image content for direct display
// }
//
// Why needed:
// This is the master list of all available images.
let availableImages = [];


// This array stores album slot data.
//
// Each element can be:
// - null  -> empty slot
// - object -> occupied slot
//
// Example occupied slot:
// {
//   entryId: unique album entry id,
//   imageId: id of placed image
// }
//
// Why needed:
// Represents user-created album structure.
let albumSlots = [];


// This variable stores selected album slot index.
//
// Possible values:
// - null -> no slot selected
// - number -> selected slot position
//
// Why needed:
// Used by "Remove Selected" functionality.
let selectedSlotIndex = null;



// =======================================================
// SLIDESHOW VARIABLES
// =======================================================

// Current slide index in slideshow sequence.
let ssIndex = 0;


// Reference to setInterval timer used for autoplay.
let ssTimer = null;


// Whether slideshow is currently playing automatically.
let ssPlaying = true;


// Delay between slides in milliseconds.
let ssIntervalMs = 1500;



// =======================================================
// DRAG AND DROP VARIABLES
// =======================================================

// Type of current drag operation.
//
// Possible values:
// - null
// - "AVAIL" : dragging from available images
// - "ALBUM" : dragging from album
let draggingType = null;


// Stores dragged image id when source is available-images section.
let draggingAvailImageId = null;


// Stores dragged slot index when source is album section.
let draggingAlbumSlotIndex = null;


// Stores current hover target cell during drag.
let $hoverTarget = null;


// Stores original source cell during drag.
let $dragSourceTd = null;


// Whether custom drag ghost is active.
let ghostOn = false;



// =======================================================
// SMALL UTILITY FUNCTIONS
// =======================================================

// This function generates a unique id string.
//
// Parameter:
// p -> prefix such as "img" or "entry"
//
// Why needed:
// Many dynamically created objects need unique identification.
function uid(p) {
  return p + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}


// This function returns number of columns used in table layouts.
//
// Why needed:
// Centralizing this value makes layout consistent.
function cols() {
  return 4;
}


// This function searches for image object by its id.
//
// Parameter:
// id -> image identifier
//
// Returns:
// matching image object or null
//
// Why needed:
// Album stores imageId only, so full image object is retrieved through this.
function getImageById(id) {
  return availableImages.find(function (i) {
    return i.id === id;
  }) || null;
}



// =======================================================
// PAGE SHOW / HIDE FUNCTIONS
// =======================================================

// This function hides all pages and shows only one target page.
//
// Parameter:
// id -> CSS selector of page to show
function showPage(id) {
  $("#page1,#page2,#page3").addClass("hidden");
  $(id).removeClass("hidden");
}


// This function updates current state and shows corresponding page.
//
// Parameter:
// s -> one of values from State object
function setState(s) {
  currentState = s;

  if (s === State.PAGE1) showPage("#page1");
  if (s === State.PAGE2) showPage("#page2");
  if (s === State.PAGE3) showPage("#page3");
}



// ============================================================
// EDIT UI MODE VARIABLES
// ============================================================

// Indicates whether Edit UI mode is active.
var uiEditing = false;


// Prevents duplicate installation of global edit handlers.
var blockerInstalled = false;


// Stores active resize operation data.
var uiResize = null;


// Stores active drag operation data for button reordering.
var uiDrag = null;



// ============================================================
// CLAMP FUNCTION
// ============================================================
//
// Restricts value v between minimum a and maximum b.
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}



// ============================================================
// CONTROL BUTTON CHECKER
// ============================================================
//
// Determines whether a button belongs to Edit UI control system.
function isControlBtn(el) {
  var cl = el.classList;
  return cl.contains("btn-edit-ui") ||
         cl.contains("btn-apply-ui") ||
         cl.contains("btn-save-ui-json") ||
         cl.contains("btn-load-ui-json");
}



// ============================================================
// SAVE / LOAD LAYOUT JSON
// ============================================================

// Captures current button order and custom sizes.
function snapshotLayout() {
  var snap = {};

  // Save button order inside each toolbar/action container.
  $(".actions-col, .topbar .actions, .slideshow-top .actions").each(function () {
    var $c = $(this);
    var order = [];

    $c.find(".btn").each(function () {
      var id = $(this).attr("id");
      if (id) order.push(id);
    });

    if (order.length) {
      var key =
        $c.attr("data-toolbar-id") ||
        $c.closest("#page1,#page2,#page3").attr("id") + "_" + $c.index();

      snap["__order__" + key] = order;
    }
  });

  // Save inline width and height values of normal buttons.
  $(".btn").each(function () {
    var $b = $(this);

    if (isControlBtn(this)) return;

    var id = $b.attr("id");
    if (!id) return;

    var s = this.style;

    if (s.width || s.height) {
      snap[id] = {
        w: s.width || "",
        h: s.height || ""
      };
    }
  });

  return snap;
}


// Applies saved button order and saved sizes.
function applySnapshot(snap) {
  Object.keys(snap).forEach(function (key) {

    if (key.indexOf("__order__") === 0) {
      var toolbarKey = key.replace("__order__", "");
      var order = snap[key];

      var $toolbar = null;

      $(".actions-col, .topbar .actions, .slideshow-top .actions").each(function () {
        var ids = [];

        $(this).find(".btn").each(function () {
          var id = $(this).attr("id");
          if (id) ids.push(id);
        });

        var match = order.some(function (id) {
          return ids.indexOf(id) > -1;
        });

        if (match) {
          $toolbar = $(this);
          return false;
        }
      });

      if (!$toolbar) return;

      order.forEach(function (id) {
        var $b = $("#" + id);
        if ($b.length) $toolbar.append($b);
      });

    } else {
      var $b = $("#" + key);
      if (!$b.length) return;

      var d = snap[key];

      if (d.w) $b.css("width", d.w);
      if (d.h) $b.css("height", d.h);
    }
  });
}


// Saves current layout as JSON file.
function saveLayoutJson() {
  var out = {
    version: 4,
    layout: snapshotLayout()
  };

  var blob = new Blob([JSON.stringify(out, null, 2)], {
    type: "application/json"
  });

  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");

  a.href = url;
  a.download = "ui-layout.json";

  document.body.appendChild(a);
  a.click();

  setTimeout(function () {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}


// Loads and applies UI layout JSON.
function loadLayoutJson(file) {
  if (!file) return;

  var fr = new FileReader();

  fr.onload = function () {
    var data;

    try {
      data = JSON.parse(fr.result);
    } catch (e) {
      alert("Invalid JSON file.");
      return;
    }

    if (!data || !data.layout) {
      alert("Not a UI layout file.");
      return;
    }

    applySnapshot(data.layout);
  };

  fr.readAsText(file);
}



// ============================================================
// RESIZE HANDLE SUPPORT
// ============================================================

// Adds resize-handle span to normal buttons if missing.
function attachHandles() {
  $(".btn").each(function () {
    if (isControlBtn(this)) return;

    var $b = $(this);

    if (!$b.find(".ui-rh").length) {
      $b.append("<span class='ui-rh'></span>");
    }
  });
}



// ============================================================
// EDIT MODE TOGGLE
// ============================================================

// Enables or disables Edit UI mode.
function setEditMode(on) {
  uiEditing = !!on;

  $("body").toggleClass("ui-editing", uiEditing);

  $(".btn-edit-ui").text(uiEditing ? "Edit UI: ON" : "Edit UI");
  $(".btn-apply-ui").toggleClass("hidden", !uiEditing);
  $(".btn-save-ui-json,.btn-load-ui-json").toggleClass("hidden", !uiEditing);

  if (uiEditing) attachHandles();
}



// ============================================================
// INJECT EDIT UI BUTTONS
// ============================================================

// Adds Edit UI / Apply / Save UI / Load UI controls to a container.
function injectEditButtons($container) {
  if ($container.find(".btn-edit-ui").length) return;

  var $ed   = $("<button class='btn btn-edit-ui' type='button'>Edit UI</button>");
  var $ap   = $("<button class='btn btn-apply-ui primary hidden' type='button'>Apply</button>");
  var $sv   = $("<button class='btn btn-save-ui-json hidden' type='button'>Save UI</button>");
  var $ld   = $("<button class='btn btn-load-ui-json hidden' type='button'>Load UI</button>");
  var $pick = $("<input type='file' class='ui-json-picker' accept='.json,application/json' hidden/>");

  $container.append($ed).append($ap).append($sv).append($ld).append($pick);

  $ed.on("click", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    setEditMode(!uiEditing);
  });

  $ap.on("click", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    setEditMode(false);
  });

  $sv.on("click", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    saveLayoutJson();
  });

  $ld.on("click", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $pick.click();
  });

  $pick.on("change", function (e) {
    loadLayoutJson(e.target.files[0]);
    e.target.value = "";
  });
}



// ============================================================
// BUTTON DRAGGING IN EDIT MODE
// ============================================================

// Starts drag for a normal UI button.
function startBtnDrag($b, clientX, clientY) {
  var $container = $b.parent();

  // Create semi-transparent ghost clone.
  var $ghost = $b.clone().removeAttr("id")
    .css({
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
      opacity: 0.65,
      margin: 0,
      width: $b.outerWidth() + "px",
      height: $b.outerHeight() + "px",
      left: clientX - $b.outerWidth() / 2 + "px",
      top: clientY - $b.outerHeight() / 2 + "px"
    })
    .appendTo("body");

  // Hide real button but keep its layout space.
  $b.css("visibility", "hidden");

  uiDrag = {
    $btn: $b,
    $container: $container,
    $ghost: $ghost,
    cx: clientX,
    cy: clientY
  };
}


// Moves edit-mode button ghost.
function moveBtnDrag(clientX, clientY) {
  if (!uiDrag) return;

  uiDrag.cx = clientX;
  uiDrag.cy = clientY;

  uiDrag.$ghost.css({
    left: clientX - uiDrag.$ghost.outerWidth() / 2 + "px",
    top: clientY - uiDrag.$ghost.outerHeight() / 2 + "px"
  });
}


// Ends edit-mode button dragging and reorders button.
function endBtnDrag() {
  if (!uiDrag) return;

  var $btn  = uiDrag.$btn;
  var $cont = uiDrag.$container;
  var cx    = uiDrag.cx;
  var cy    = uiDrag.cy;
  var isCol = $cont.css("flex-direction") === "column";

  uiDrag.$ghost.remove();
  $btn.css("visibility", "");

  var bestDist = Infinity;
  var $insertBefore = null;

  $cont.children(".btn").each(function () {
    if (this === $btn[0]) return;

    var r = this.getBoundingClientRect();
    var mid = isCol ? (r.top + r.bottom) / 2 : (r.left + r.right) / 2;
    var pos = isCol ? cy : cx;
    var d = Math.abs(pos - mid);

    if (d < bestDist) {
      bestDist = d;
      $insertBefore = $(this);
    }
  });

  if ($insertBefore) $insertBefore.before($btn);
  else $cont.append($btn);

  uiDrag = null;
}



// ============================================================
// GLOBAL EDIT MODE HANDLERS
// ============================================================

// Installs mouse and click handlers required by Edit UI mode.
function installEditUIHandlers() {
  if (blockerInstalled) return;
  blockerInstalled = true;

  // Prevent normal button click behavior during edit mode.
  document.addEventListener("click", function (e) {
    if (!uiEditing) return;

    var btn = e.target && e.target.closest ? e.target.closest(".btn") : null;
    if (!btn || isControlBtn(btn)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }, true);

  // Start drag or resize on mousedown.
  $(document).on("mousedown", ".btn", function (e) {
    if (!uiEditing || e.which !== 1) return;
    if (isControlBtn(this)) return;

    var $b = $(this);

    // If resize handle clicked, begin resize logic.
    if ($(e.target).hasClass("ui-rh")) {
      e.preventDefault();
      e.stopPropagation();

      uiResize = {
        $btn: $b,
        ox: e.clientX,
        oy: e.clientY,
        startW: $b.outerWidth(),
        startH: $b.outerHeight()
      };

      $("body").addClass("noselect");
      return;
    }

    // Otherwise begin drag for reordering.
    e.preventDefault();
    startBtnDrag($b, e.clientX, e.clientY);
    $("body").addClass("noselect");
  });

  // Continue drag or resize while mouse moves.
  $(document).on("mousemove", function (e) {
    if (uiDrag) moveBtnDrag(e.clientX, e.clientY);

    if (uiResize) {
      var $b = uiResize.$btn;

      var nW = clamp(uiResize.startW + (e.clientX - uiResize.ox), 40, 700);
      var nH = clamp(uiResize.startH + (e.clientY - uiResize.oy), 24, 200);

      $b.css({
        width: nW + "px",
        height: nH + "px"
      });
    }
  });

  // Finish drag/resize on mouse release.
  $(document).on("mouseup", function () {
    if (uiDrag) endBtnDrag();
    if (uiResize) uiResize = null;

    $("body").removeClass("noselect");
  });
}


// Initializes complete Edit UI system.
function initEditUI() {
  installEditUIHandlers();

  injectEditButtons($("#page1 .actions-col"));
  injectEditButtons($("#page2 .topbar .actions").first());
  injectEditButtons($("#page3 .slideshow-top .actions").first());

  attachHandles();
  setEditMode(false);
}



// ============================================================
// ALBUM HELPER FUNCTIONS
// ============================================================

// Returns minimum initial album slots.
function minInitialAlbumSlots() {
  return Math.max(cols() * 3, availableImages.length);
}


// Counts how many album slots are currently empty.
function countEmptySlots() {
  return albumSlots.filter(function (s) {
    return s === null;
  }).length;
}


// Ensures album has at least n empty slots.
function ensureAlbumCapacity(n) {
  if (n === undefined) n = 1;

  if (!albumSlots.length) {
    albumSlots = Array.from(
      { length: minInitialAlbumSlots() },
      function () { return null; }
    );
    return;
  }

  while (countEmptySlots() < n) {
    for (var i = 0; i < cols(); i++) albumSlots.push(null);
  }
}


// Returns first empty slot index.
function firstEmptySlotIndex() {
  return albumSlots.findIndex(function (s) {
    return s === null;
  });
}


// Converts albumSlots into ordered image sequence for slideshow.
function albumSequence() {
  var seq = [];

  albumSlots.forEach(function (slot) {
    if (!slot) return;

    var img = getImageById(slot.imageId);
    if (img) seq.push(img);
  });

  return seq;
}



// ============================================================
// DELAY PARSING
// ============================================================

// Converts text input like "0.5 sec" or "1 min" into milliseconds.
function parseDelayToMs(input) {
  if (input == null) return null;

  var s = String(input).trim().toLowerCase();
  if (!s) return null;

  s = s.replace(/,/g, ".").replace(/\s+/g, " ");
  s = s.replace(/(\d)(ms|msec|milliseconds?|s|secs?|seconds?|mins?|minutes?)\b/g, "$1 $2");

  var m = s.match(/^([0-9]*\.?[0-9]+)\s*(ms|msec|milliseconds?|s|secs?|seconds?|mins?|minutes?)?$/);
  if (!m) return null;

  var v = parseFloat(m[1]);
  if (!isFinite(v) || v <= 0) return null;

  var u = m[2] || "s";

  if (/^ms|msec|milli/.test(u)) return Math.round(v);
  if (/^min/.test(u)) return Math.round(v * 60000);

  return Math.round(v * 1000);
}



// ============================================================
// RENDER AVAILABLE IMAGES
// ============================================================

// Draws available image table into given tbody.
function renderAvailable($tbody, draggable) {
  $tbody.empty();

  var c = cols();
  var count = availableImages.length;
  var rows = Math.ceil(count / c);

  if (!count) return;

  var i = 0;

  for (var y = 0; y < rows; y++) {
    var $tr = $("<tr>");

    for (var x = 0; x < c; x++) {
      if (i < count) {
        var img = availableImages[i];
        var $td = $("<td>").attr("data-image-id", img.id);

        if (draggable) $td.attr("draggable", "true");

        $td.append(
          $("<img>")
            .addClass("thumb")
            .attr("src", img.dataUrl)
            .attr("alt", img.name)
            .attr("draggable", "true")
        );

        $tr.append($td);
        i++;
      } else {
        $tr.append($("<td>").addClass("empty"));
      }
    }

    $tbody.append($tr);
  }
}



// ============================================================
// RENDER ALBUM
// ============================================================

// Rebuilds album table UI from albumSlots array.
function renderAlbum() {
  ensureAlbumCapacity(1);

  var $tbody = $("#albumTable tbody");
  $tbody.empty();

  var c = cols();
  var total = albumSlots.length;
  var rows = Math.max(3, Math.ceil(total / c));
  var k = 0;

  for (var y = 0; y < rows; y++) {
    var $tr = $("<tr>");

    for (var x = 0; x < c; x++) {
      if (k < total) {
        var slot = albumSlots[k];

        var $td = $("<td>")
          .attr("data-slot-index", k)
          .toggleClass("selected", k === selectedSlotIndex);

        if (slot) {
          $td.attr("draggable", "true");

          var img = getImageById(slot.imageId);
          if (img) {
            $td.append(
              $("<img>")
                .addClass("thumb")
                .attr("src", img.dataUrl)
                .attr("alt", img.name)
                .attr("draggable", "true")
            );
          }
        } else {
          $td.addClass("slot-empty");
        }

        $tr.append($td);
        k++;
      } else {
        $tr.append($("<td>").addClass("empty"));
      }
    }

    $tbody.append($tr);
  }

  var filled = albumSlots.some(function (s) {
    return s !== null;
  });

  $("#albumDropHint").toggleClass("hidden", filled);
  $("#btnClearAlbum").prop("disabled", !filled);
  $("#btnRemoveSelectedAlbum").prop(
    "disabled",
    selectedSlotIndex == null || albumSlots[selectedSlotIndex] == null
  );
}


// Renders all available tables and album together.
function renderAll() {
  renderAvailable($("#availableTable_p1 tbody"), false);
  renderAvailable($("#availableTable_p2 tbody"), true);
  renderAlbum();
}



// ============================================================
// IMPORT FILES
// ============================================================

// Imports selected image files and adds them to availableImages.
function importFiles(files) {
  var imgs = Array.from(files || []).filter(function (f) {
    return (f.type || "").startsWith("image/");
  });

  if (!imgs.length) return;

  var jobs = imgs.map(function (f) {
    return new Promise(function (res) {
      var fr = new FileReader();

      fr.onload = function () {
        res({
          id: uid("img"),
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: fr.result
        });
      };

      fr.readAsDataURL(f);
    });
  });

  Promise.all(jobs).then(function (list) {
    availableImages.push.apply(availableImages, list);

    if (!albumSlots.length) ensureAlbumCapacity(1);

    if (albumSlots.length < availableImages.length) {
      var n = availableImages.length - albumSlots.length;
      for (var i = 0; i < n; i++) albumSlots.push(null);
    }

    ensureAlbumCapacity(1);
    renderAll();
  });
}



// ============================================================
// ALBUM MODIFICATION
// ============================================================

// Places an image into a specific album slot.
function fillSlot(idx, imageId) {
  if (idx == null || idx < 0) return;

  while (idx >= albumSlots.length) {
    for (var i = 0; i < cols(); i++) albumSlots.push(null);
  }

  albumSlots[idx] = {
    entryId: uid("entry"),
    imageId: imageId
  };

  ensureAlbumCapacity(1);
  renderAlbum();
}


// Clears complete album.
function clearAlbum() {
  var keep = Math.max(minInitialAlbumSlots(), cols() * 3);

  albumSlots = Array.from({ length: keep }, function () {
    return null;
  });

  selectedSlotIndex = null;
  renderAlbum();
}


// Removes currently selected album slot.
function removeSelected() {
  if (selectedSlotIndex == null || albumSlots[selectedSlotIndex] == null) return;

  albumSlots[selectedSlotIndex] = null;
  selectedSlotIndex = null;
  renderAlbum();
}


// Swaps two occupied album slots.
function swapSlots(i, j) {
  if (i == null || j == null || i === j) return;

  var tmp = albumSlots[i];
  albumSlots[i] = albumSlots[j];
  albumSlots[j] = tmp;

  renderAlbum();
}


// Moves one album slot into an empty destination slot.
function moveSlotToEmpty(from, to) {
  if (from == null || to == null) return;

  while (to >= albumSlots.length) {
    for (var i = 0; i < cols(); i++) albumSlots.push(null);
  }

  if (!albumSlots[from] || albumSlots[to]) return;

  albumSlots[to] = albumSlots[from];
  albumSlots[from] = null;

  ensureAlbumCapacity(1);
  renderAlbum();
}



// ============================================================
// DRAG HOVER HELPERS
// ============================================================

// Clears current drag hover styling.
function clearHover() {
  if ($hoverTarget) {
    $hoverTarget.removeClass("drop-hover drop-target");
    $hoverTarget = null;
  }
}


// Applies hover style to target slot.
function setHover($td, onlyEmpty) {
  if (!$td || !$td.length) return;
  if ($hoverTarget && $hoverTarget[0] === $td[0]) return;

  clearHover();
  $hoverTarget = $td;

  if (onlyEmpty) {
    if ($td.hasClass("slot-empty")) $td.addClass("drop-hover");
  } else {
    $td.addClass("drop-target");
  }
}


// Marks all empty album slots as ready for drop.
function setEmptySlotsReady(on) {
  if (on) $("#albumTable td.slot-empty").addClass("drop-ready");
  else $("#albumTable td.slot-empty").removeClass("drop-ready drop-hover");
}



// ============================================================
// DRAG GHOST HELPERS
// ============================================================

// Ensures dragGhost element exists.
function ensureDragGhost() {
  if ($("#dragGhost").length) return;
  $("body").append('<div id="dragGhost"><img alt=""/></div>');
}


// Starts drag ghost with image preview.
function startGhost(url) {
  ensureDragGhost();
  $("#dragGhost img").attr("src", url);
  ghostOn = true;
}


// Moves drag ghost near cursor.
function moveGhost(x, y) {
  if (!ghostOn) return;
  $("#dragGhost").css("transform", "translate3d(" + (x + 18) + "px," + (y + 18) + "px,0)");
}


// Stops drag ghost display.
function stopGhost() {
  ghostOn = false;
  $("#dragGhost").css("transform", "translate3d(-9999px,-9999px,0)");
}


// Marks source cell visually.
function markSourceTd($td) {
  if ($dragSourceTd) $dragSourceTd.removeClass("dragging-source");
  $dragSourceTd = $td;
  if ($td) $td.addClass("dragging-source");
}


// Clears source-cell marking.
function clearSourceTd() {
  if ($dragSourceTd) {
    $dragSourceTd.removeClass("dragging-source");
    $dragSourceTd = null;
  }
}


// Clears all temporary drag UI state.
function cleanupDragUI() {
  clearHover();
  clearSourceTd();
  stopGhost();
  setEmptySlotsReady(false);

  draggingType = null;
  draggingAvailImageId = null;
  draggingAlbumSlotIndex = null;
}



// ============================================================
// SLIDESHOW LOGIC
// ============================================================

// Stops active autoplay timer.
function stopSlideshow() {
  if (ssTimer) {
    clearInterval(ssTimer);
    ssTimer = null;
  }
}


// Starts autoplay using current slideshow delay.
function startAutoplay() {
  stopSlideshow();

  ssTimer = setInterval(function () {
    if (ssPlaying) nextSlide();
  }, ssIntervalMs);
}


// Renders current slide image and counter.
function renderSlide() {
  var seq = albumSequence();
  if (!seq.length) return;

  ssIndex = Math.max(0, Math.min(ssIndex, seq.length - 1));

  $("#ssImg").attr("src", seq[ssIndex].dataUrl);
  $("#ssCounter").text((ssIndex + 1) + " / " + seq.length);
}


// Goes to next slide.
function nextSlide() {
  var s = albumSequence();
  if (!s.length) return;

  ssIndex = (ssIndex + 1) % s.length;
  renderSlide();
}


// Goes to previous slide.
function prevSlide() {
  var s = albumSequence();
  if (!s.length) return;

  ssIndex = (ssIndex - 1 + s.length) % s.length;
  renderSlide();
}


// Enters slideshow page after validation.
function enterSlideshowPage() {
  var seq = albumSequence();

  if (!seq.length) {
    alert("Album is empty.");
    return;
  }

  if (!$("#delayInput").val()) {
    $("#delayInput").val(ssIntervalMs / 1000 + " sec");
  }

  ssIndex = 0;
  ssPlaying = true;

  setState(State.PAGE3);
  renderSlide();
  startAutoplay();

  $("#btnPlayPause").text("Pause");
}



// ============================================================
// SAVE / LOAD SLIDESHOW JSON
// ============================================================

// Saves current slideshow project as JSON.
function saveSlideshow() {
  var seq = albumSequence();

  if (!seq.length) {
    alert("Album is empty — nothing to save.");
    return;
  }

  var out = {
    version: 1,
    images: availableImages.map(function (img) {
      return {
        id: img.id,
        name: img.name,
        type: img.type || "image/*",
        dataUrl: img.dataUrl
      };
    }),
    album: albumSlots.map(function (slot) {
      return slot ? slot.imageId : null;
    }),
    delayMs: ssIntervalMs
  };

  var blob = new Blob([JSON.stringify(out, null, 2)], {
    type: "application/json"
  });

  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");

  a.href = url;
  a.download = "slideshow.json";

  document.body.appendChild(a);
  a.click();

  setTimeout(function () {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}


// Loads slideshow project JSON.
function loadSlideshowFromJson(file) {
  if (!file) return;

  var fr = new FileReader();

  fr.onload = function () {
    var data;

    try {
      data = JSON.parse(fr.result);
    } catch (e) {
      alert("Invalid JSON file.");
      return;
    }

    if (!data || !Array.isArray(data.images)) {
      alert("This doesn't look like a slideshow JSON.");
      return;
    }

    availableImages = data.images.map(function (img) {
      return {
        id: img.id,
        name: img.name,
        type: img.type || "image/*",
        dataUrl: img.dataUrl
      };
    });

    if (Array.isArray(data.album)) {
      albumSlots = data.album.map(function (imageId) {
        if (!imageId) return null;

        return {
          entryId: uid("entry"),
          imageId: imageId
        };
      });

      ensureAlbumCapacity(1);
    } else {
      albumSlots = [];
      ensureAlbumCapacity(1);
    }

    if (data.delayMs && data.delayMs > 0) ssIntervalMs = data.delayMs;

    selectedSlotIndex = null;

    setState(State.PAGE1);
    renderAll();

    alert("Loaded! " + availableImages.length + " image(s), " + albumSequence().length + " in album.");
  };

  fr.readAsText(file);
}



// ============================================================
// MAIN STARTUP AND EVENT BINDINGS
// ============================================================
//
// This block runs after DOM is fully loaded.
$(function () {
  ensureDragGhost();
  initEditUI();

  $(document).on("dragover", function (e) {
    moveGhost(e.originalEvent.clientX, e.originalEvent.clientY);
  });

  $(document).on("drop", function () {
    cleanupDragUI();
  });

  $(document).on("keyup", function (e) {
    if (e.key === "Escape") {
      cleanupDragUI();
      if (uiEditing) setEditMode(false);
    }
  });



  // ==========================================================
  // PAGE 1 EVENTS
  // ==========================================================

  $("#btnLoadImages").on("click", function () {
    $("#filePicker").click();
  });

  $("#btnAddMore").on("click", function () {
    $("#filePicker").click();
  });

  $("#filePicker").on("change", function (e) {
    importFiles(e.target.files);
    e.target.value = "";
  });

  $("#btnLoadJson").on("click", function () {
    if (uiEditing) return;
    $("#jsonPicker").click();
  });

  $("#jsonPicker").on("change", function (e) {
    loadSlideshowFromJson(e.target.files[0]);
    e.target.value = "";
  });

  $("#btnCustomize").on("click", function () {
    if (uiEditing) return;
    setState(State.PAGE2);
    renderAll();
  });

  $("#btnMakeSlideshowFromP1").on("click", function () {
    if (uiEditing) return;

    if (!availableImages.length) {
      alert("No images loaded.");
      return;
    }

    albumSlots = [];
    ensureAlbumCapacity(availableImages.length + 1);

    for (var i = 0; i < availableImages.length; i++) {
      albumSlots[i] = {
        entryId: uid("entry"),
        imageId: availableImages[i].id
      };
    }

    ensureAlbumCapacity(1);
    renderAll();
    enterSlideshowPage();
  });



  // ==========================================================
  // PAGE 2 EVENTS
  // ==========================================================

  $("#btnBackToP1").on("click", function () {
    if (uiEditing) return;
    setState(State.PAGE1);
    renderAll();
  });

  $("#btnMakeSlideshow").on("click", function () {
    if (uiEditing) return;
    enterSlideshowPage();
  });



  // ==========================================================
  // PAGE 3 EVENTS
  // ==========================================================

  $("#btnExitToAlbum").on("click", function () {
    stopSlideshow();
    setState(State.PAGE2);
    renderAll();
  });

  $("#btnPrev").on("click", prevSlide);
  $("#btnNext").on("click", nextSlide);

  $("#btnPlayPause").on("click", function () {
    ssPlaying = !ssPlaying;
    $("#btnPlayPause").text(ssPlaying ? "Pause" : "Play");
  });

  $("#btnApplyDelay").on("click", function () {
    var ms = parseDelayToMs($("#delayInput").val());

    if (ms == null) {
      alert("Invalid delay. Try: 0.5 sec, 2 sec, 200 ms, 1 min");
      return;
    }

    ssIntervalMs = ms;
    startAutoplay();
  });

  $("#btnSaveJsonP3").on("click", function () {
    saveSlideshow();
  });



  // ==========================================================
  // ALBUM INTERACTION EVENTS
  // ==========================================================

  $(document).on("click", "#albumTable td[data-slot-index]", function () {
    var idx = parseInt($(this).attr("data-slot-index"), 10);
    if (!isFinite(idx)) return;

    selectedSlotIndex = idx;
    renderAlbum();
  });

  $("#btnClearAlbum").on("click", clearAlbum);
  $("#btnRemoveSelectedAlbum").on("click", removeSelected);



  // ==========================================================
  // DRAG FROM AVAILABLE IMAGES
  // ==========================================================

  $(document).on(
    "dragstart",
    "#availableTable_p2 td[data-image-id], #availableTable_p2 td[data-image-id] img",
    function (ev) {
      var $td = $(this).closest("td");
      var imageId = $td.attr("data-image-id");
      var img = getImageById(imageId);

      if (!img) return;

      draggingType = "AVAIL";
      draggingAvailImageId = imageId;
      draggingAlbumSlotIndex = null;

      markSourceTd($td);
      startGhost(img.dataUrl);
      setEmptySlotsReady(true);

      if (ev.originalEvent && ev.originalEvent.dataTransfer) {
        ev.originalEvent.dataTransfer.setData("text/plain", imageId);
        ev.originalEvent.dataTransfer.effectAllowed = "copy";

        var $t = $("<div>").css({
          width: "1px",
          height: "1px",
          opacity: 0
        }).appendTo("body");

        ev.originalEvent.dataTransfer.setDragImage($t[0], 0, 0);

        setTimeout(function () {
          $t.remove();
        }, 0);
      }
    }
  );



  // ==========================================================
  // DRAG FROM ALBUM
  // ==========================================================

  $(document).on(
    "dragstart",
    "#albumTable td[data-slot-index][draggable='true'], #albumTable td[data-slot-index][draggable='true'] img",
    function (ev) {
      var $td = $(this).closest("td");
      var idx = parseInt($td.attr("data-slot-index"), 10);

      if (!isFinite(idx)) return;

      var slot = albumSlots[idx];
      if (!slot) return;

      var img = getImageById(slot.imageId);
      if (!img) return;

      draggingType = "ALBUM";
      draggingAlbumSlotIndex = idx;
      draggingAvailImageId = null;

      markSourceTd($td);
      startGhost(img.dataUrl);
      setEmptySlotsReady(true);

      if (ev.originalEvent && ev.originalEvent.dataTransfer) {
        ev.originalEvent.dataTransfer.setData("text/plain", "album:" + idx);
        ev.originalEvent.dataTransfer.effectAllowed = "move";

        var $t = $("<div>").css({
          width: "1px",
          height: "1px",
          opacity: 0
        }).appendTo("body");

        ev.originalEvent.dataTransfer.setDragImage($t[0], 0, 0);

        setTimeout(function () {
          $t.remove();
        }, 0);
      }
    }
  );



  // ==========================================================
  // DRAG OVER ALBUM CELL
  // ==========================================================

  $(document).on("dragover", "#albumTable td[data-slot-index]", function (ev) {
    ev.preventDefault();

    if (draggingType === "AVAIL") {
      setHover($(this), true);
    } else if (draggingType === "ALBUM") {
      setHover($(this), false);
    }
  });

  $(document).on("dragleave", "#albumTable td[data-slot-index]", function () {
    clearHover();
  });



  // ==========================================================
  // DROP ON SPECIFIC ALBUM SLOT
  // ==========================================================

  $(document).on("drop", "#albumTable td[data-slot-index]", function (ev) {
    ev.preventDefault();

    var $td = $(this);
    var idx = parseInt($td.attr("data-slot-index"), 10);

    if (draggingType === "AVAIL" && draggingAvailImageId) {
      if ($td.hasClass("slot-empty")) {
        fillSlot(idx, draggingAvailImageId);
      }
    } else if (draggingType === "ALBUM" && draggingAlbumSlotIndex != null) {
      if (idx !== draggingAlbumSlotIndex) {
        if ($td.hasClass("slot-empty")) {
          moveSlotToEmpty(draggingAlbumSlotIndex, idx);
        } else {
          swapSlots(draggingAlbumSlotIndex, idx);
        }
      }
    }

    cleanupDragUI();
  });



  // ==========================================================
  // DROP ON GENERAL ALBUM AREA
  // ==========================================================

  $(document).on("dragover", "#albumDropZone", function (ev) {
    ev.preventDefault();
  });

  $(document).on("drop", "#albumDropZone", function (ev) {
    var $tgt = $(ev.target).closest("#albumTable td[data-slot-index]");
    if ($tgt.length) return;

    ev.preventDefault();

    ensureAlbumCapacity(1);

    var empty = firstEmptySlotIndex();
    if (empty === -1) {
      cleanupDragUI();
      return;
    }

    if (draggingType === "AVAIL" && draggingAvailImageId) {
      fillSlot(empty, draggingAvailImageId);
    } else if (draggingType === "ALBUM" && draggingAlbumSlotIndex != null) {
      moveSlotToEmpty(draggingAlbumSlotIndex, empty);
    }

    cleanupDragUI();
  });

  $(document).on("dragend", function () {
    cleanupDragUI();
  });



  // ==========================================================
  // INITIAL APP STARTUP
  // ==========================================================

  setState(State.PAGE1);
  renderAll();
});