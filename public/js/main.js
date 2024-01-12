// Control Selectors
var controlItem = $(".control-item"),
  mapLatLng = $(".map-latlng-control"),
  mapFence = $(".map-fence-control"),
  logOut = $(".log-out");

// Navbar Selectors
var markerControls = $(".marker-controls"),
  fenceControls = $(".virtual-fence");

markerControls.click(function () {
  controlItem.addClass("hidden");
  mapLatLng.toggleClass("hidden");
});

fenceControls.click(function () {
  controlItem.addClass("hidden");
  mapFence.toggleClass("hidden");
});

logOut.click(function () {
  window.location.href = "/logout";
});

var alertButton = $(".alert-button button"),
  alertWindow = $("#fence-alert");

alertButton.click(function () {
  alertWindow.removeClass("hidden");
});
