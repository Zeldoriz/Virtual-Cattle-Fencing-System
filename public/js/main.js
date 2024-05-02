function redirectCC() {
  window.open("https://mxmmvwc3-5000.asse.devtunnels.ms/", "blank");
}

// Control Selectors
var controlItem = $(".control-item"),
  mapLatLng = $(".map-latlng-control"),
  mapFence = $(".map-fence-control"),
  mapLogTable = $(".map-pos-table"),
  logOut = $(".log-out");

// Navbar Selectors
var markerControls = $(".marker-controls"),
  fenceControls = $(".virtual-fence"),
  tableControls = $(".statistics");

markerControls.click(function () {
  controlItem.addClass("hidden");
  mapLatLng.toggleClass("hidden");
});

fenceControls.click(function () {
  controlItem.addClass("hidden");
  mapFence.toggleClass("hidden");
});

tableControls.click(function () {
  controlItem.addClass("hidden");
  mapLogTable.toggleClass("hidden");
  drawTable();
});

logOut.click(function () {
  window.location.href = "/logout";
});

var alertButton = $(".alert-button button"),
  alertWindow = $("#fence-alert");

alertButton.click(function () {
  alertWindow.toggleClass("hidden");
});

var table = document.getElementById("map-pos-table-data");
var prevDataCount;

function drawTable() {
  table.innerHTML = "";
  $.get("/get-tableData", function (data) {
    console.log(data);
    for (var i = 0; i < data.length; i++) {
      var row = `<tr> 
                  <td>${data[i].order}</td> 
                  <td class="table-coords-data">${parseFloat(data[i].lat).toFixed(5)}</td> 
                  <td class="table-coords-data">${parseFloat(data[i].lng).toFixed(5)}</td> 
                 </tr>`;
      table.innerHTML += row;
      prevDataLength = data.length;
    }
  });
}

drawTable();
setInterval(function () {
  $.get("/get-tableData", function (data) {
    if (data.length != prevDataLength) drawTable();
  });
}, 1000);
