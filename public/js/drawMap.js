var mapOptions;
var map;

var newShape = {};
var checkShape = false;

var prevLoc = {};
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
    // drawingMode: google.maps.drawing.OverlayType.MARKER,
    // drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        // google.maps.drawing.OverlayType.MARKER,
        // google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.POLYGON,
        // google.maps.drawing.OverlayType.RECTANGLE
      ],
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
  $.get("/get-tableData", function (data) {

    for (i = 0; i < 5; i++) {
      prevLoc[i] = { lat: parseFloat(data[i].lat), lng: parseFloat(data[i].lng) };
      var marker = new google.maps.Marker({
        position: { lat: data[i].lat, lng: data[i].lng },
        map,
        label: { color: '#000000', fontWeight: 'bold', fontSize: '14px', text: 'Board ' + data[i].board_number },
      });
      marker.setMap(map);
      markers[data[i].board_number] = (marker);
    }
  });
}

InitMap();

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
  $.get("/updateData", tempLoc, function () { });

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
// setInterval(() => {
//   $.get("/get-loc", function (data) {
//     (lat = data.lat), (lng = data.lng);
//     console.log(lat, lng);
//     var newLoc = new google.maps.LatLng(lat, lng);
//     if (prevLoc.lat != lat || prevLoc.lng != lng) {
//       map.setCenter(newLoc);
//     }
//     marker.setPosition(newLoc);

//     prevLoc.lat = lat;
//     prevLoc.lng = lng;
//     console.log("Marker moved automatically!");

//     //Check if marker is within polygon
//     if (checkShape) {
//       const isMarkerInPolygon = google.maps.geometry.poly.containsLocation(marker.getPosition(), newShape);
//       //Make more markers & functions for multi-board system
//       if (!isMarkerInPolygon)
//         if ($("#fence-alert").hasClass("hidden")) {
//           $("#fence-alert").toggleClass("hidden");
//           $(".alert-content p span").html(" 1 ");
//         }
//     }
//   });
// }, 1000);


async function updateMarker(newmarker, local_board_number, the_map) {
  const marker = new google.maps.Marker({
    map: the_map, position: { lat: newmarker.lat, lng: newmarker.lng }, label: { color: '#000000', fontWeight: 'bold', fontSize: '14px', text: 'Board ' + local_board_number }
  });
  marker.setMap(the_map);
  marker_arr[local_board_number] = marker;
  console.log("Adding marker");
}

setInterval(() => {
  $.get("/get-tableData", function (data) {

    for (i = 0; i < 5; i++) {
      if (data[i].lat != prevLoc[i].lat || data[i].lng != prevLoc[i].lng) {
        markers[data[i].board_number].setMap(null);
        prevLoc[i] = { lat: parseFloat(data[i].lat), lng: parseFloat(data[i].lng) };
        updateMarker(data[i], data[i].board_number, map)
      }
    }

    console.log("Marker moved automatically!");

    //Check if marker is within polygon
    if (checkShape) {
      const isMarkerInPolygon = google.maps.geometry.poly.containsLocation(marker.getPosition(), newShape);
      //Make more markers & functions for multi-board system
      if (!isMarkerInPolygon)
        if ($("#fence-alert").hasClass("hidden")) {
          $("#fence-alert").toggleClass("hidden");
          $(".alert-content p span").html(" 1 ");
        }
    }
  });
}, 1000);
