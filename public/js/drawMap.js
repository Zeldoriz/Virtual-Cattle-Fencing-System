var mapOptions;
var map;

var newShape = {};
var checkShape = false;

var prevLoc = { lat: 0, lng: 0 };
var lat, lng;
var marker;
var markers = [];

var coordinates = [];
let new_coordinates = [];
let lastElement;

function InitMap() {
  //Init-map
  var location = new google.maps.LatLng(23.89246790936712, 121.54415209166598);
  mapOptions = {
    zoom: 15,
    center: location,
    mapTypeId: google.maps.MapTypeId.RoadMap,
    gestureHandling: "greedy",
  };
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  var all_overlays = [];
  var selectedShape;
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.POLYGON],
    },
    markerOptions: {
      //icon: 'images/beachflag.png'
    },
    circleOptions: {
      fillColor: "#ffff00",
      fillOpacity: 0.2,
      strokeWeight: 3,
      clickable: false,
      editable: true,
      zIndex: 1,
    },
    polygonOptions: {
      clickable: true,
      draggable: false,
      editable: true,
      // fillColor: '#ffff00',
      fillColor: "#ADFF2F",
      fillOpacity: 0.5,
    },
    rectangleOptions: {
      clickable: true,
      draggable: true,
      editable: true,
      fillColor: "#ffff00",
      fillOpacity: 0.5,
    },
  });

  function clearSelection() {
    if (selectedShape) {
      selectedShape.setEditable(false);
      selectedShape = null;
    }
  }
  //to disable drawing tools
  function stopDrawing() {
    drawingManager.setMap(null);
  }

  function setSelection(shape) {
    clearSelection();
    stopDrawing();
    selectedShape = shape;
    shape.setEditable(true);
  }

  function deleteSelectedShape() {
    if (selectedShape) {
      selectedShape.setMap(null);
      drawingManager.setMap(map);
      coordinates.splice(0, coordinates.length);
      document.getElementById("polygon-coords").innerText = "";
    }
  }

  function CenterControl(controlDiv, map) {
    // Set CSS for the control border.
    var controlUI = document.createElement("div");
    controlUI.style.backgroundColor = "#fff";
    controlUI.style.border = "2px solid #fff";
    controlUI.style.borderRadius = "3px";
    controlUI.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
    controlUI.style.cursor = "pointer";
    controlUI.style.marginBottom = "22px";
    controlUI.style.textAlign = "center";
    controlUI.title = "Select to delete the shape";
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement("div");
    controlText.style.color = "rgb(25,25,25)";
    controlText.style.fontFamily = "Roboto,Arial,sans-serif";
    controlText.style.fontSize = "16px";
    controlText.style.lineHeight = "38px";
    controlText.style.paddingLeft = "5px";
    controlText.style.paddingRight = "5px";
    controlText.innerHTML = "Delete Selected Area";
    controlUI.appendChild(controlText);

    //to delete the polygon
    controlUI.addEventListener("click", function () {
      deleteSelectedShape();
      checkShape = false;

      //Update polygon status in express server
      fetch("/api/delete-polygon", {
        method: "POST",
      });
    });
  }

  drawingManager.setMap(map);

  var getPolygonCoords = function (newShape) {
    coordinates.splice(0, coordinates.length);

    var len = newShape.getPath().getLength();

    for (var i = 0; i < len; i++) {
      coordinates.push(newShape.getPath().getAt(i).toUrlValue(6));
    }
    document.getElementById("polygon-coords").innerText = coordinates;

    //Post request to Express
    const dataToSend = { coords: coordinates };
    fetch("/api/endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data received from server:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  google.maps.event.addListener(drawingManager, "polygoncomplete", function (event) {
    event.getPath().getLength();
    google.maps.event.addListener(event, "dragend", getPolygonCoords(event));

    google.maps.event.addListener(event.getPath(), "insert_at", function () {
      getPolygonCoords(event);
    });

    google.maps.event.addListener(event.getPath(), "set_at", function () {
      getPolygonCoords(event);
    });
  });

  google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {
    all_overlays.push(event);
    if (event.type !== google.maps.drawing.OverlayType.MARKER) {
      drawingManager.setDrawingMode(null);

      newShape = event.overlay;
      newShape.type = event.type;
      checkShape = true;
      google.maps.event.addListener(newShape, "click", function () {
        setSelection(newShape);
      });
      setSelection(newShape);
    }
  });

  var centerControlDiv = document.createElement("div");
  var centerControl = new CenterControl(centerControlDiv, map);

  centerControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);

  //Initialize marker
  marker = new google.maps.Marker({
    position: location,
    map,
    title: "GPS Location",
  });
  marker.setMap(map);
  markers.push(marker);
}

// Function to fetch stored overlay data from the server
function fetchOverlayData() {
  fetch("/api/get-overlay")
    .then((response) => response.json())
    .then((data) => {
      if (data.checkPolygon === true) {
        // Convert the coordinates to LatLng objects
        polygonCoords = "";
        //FIX THIS PART to make polygonCoords the lat and lng of a google map coordinates from the object:
        // coords: [
        //   '23.895038,121.539646',
        //   '23.889074,121.538273',
        //   '23.893508,121.541534'
        // ],
        console.log(polygonCoords);

        const polygon = new google.maps.Polygon({
          paths: polygonCoords,
          map: map,
          clickable: true,
          draggable: false,
          editable: true,
          fillColor: "#ADFF2F",
          fillOpacity: 0.5,
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching overlay data:", error);
    });
}

InitMap();
fetchOverlayData();

//Move marker manually
function moveMarker() {
  lat = $("#lat").val();
  lng = $("#lng").val();
  console.log(lat, lng);
  var newLoc = new google.maps.LatLng(lat, lng);
  console.log(newLoc);
  map.setCenter(newLoc);
  marker.setPosition(newLoc);

  let tempLoc = { lat: lat, lng: lng };
  //Update gps data in server
  $.get("/updateData", tempLoc, function () {});

  console.log("Marker moved manually!");
}

//Force refresh marker location
function moveMarkerESP() {
  $.get("/get-loc", function (data) {
    (lat = data.lat), (lng = data.lng);
    console.log(lat, lng);
    var newLoc = new google.maps.LatLng(lat, lng);
    map.setCenter(newLoc);
    marker.setPosition(newLoc);

    console.log("Marker location refreshed!");
  });
}

//Auto refresh marker location
setInterval(function () {
  $.get("/get-loc", function (data) {
    (lat = data.lat), (lng = data.lng);
    console.log(lat, lng);
    var newLoc = new google.maps.LatLng(lat, lng);
    if (prevLoc.lat != lat || prevLoc.lng != lng) {
      map.setCenter(newLoc);
    }
    marker.setPosition(newLoc);

    prevLoc.lat = lat;
    prevLoc.lng = lng;
    console.log("Marker moved automatically!");
  });
}, 1000);

//Notification handler
function pushNotif(cowID) {
  console.log(cowID);
  const notification = new Notification("Virtual Fence", { body: "Cow " + cowID + " escaped!" });
}

//Check if marker is within polygon
setInterval(function () {
  if (checkShape) {
    const isMarkerInPolygon = google.maps.geometry.poly.containsLocation(marker.getPosition(), newShape);
    //Make more cowIDs & functions for multi-board system
    if (!isMarkerInPolygon) {
      var cowID = 1;
      if (Notification.permission === "granted") pushNotif(cowID);
      else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            pushNotif(cowID);
          }
        });
      }
      // if ($("#fence-alert").hasClass("hidden")) {
      //   $("#fence-alert").toggleClass("hidden");
      //   $(".alert-content p span").html(" 1 ");
      // }
    }
  }
}, 5000);
