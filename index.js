import express from "express";
import bodyParser from "body-parser";
import * as lib from './database.js';
// import { getAllData, getData, createData, changeData, getLastData, getAllLastData, getAllDataofBoard } from "./database.js";
const app = express();
const port = 3000;
var temp = "";
var posCount = 1;
var posLog = [{ lat: 23.89246790936712, lng: 121.54415209166598, order: posCount }];
var loc = { lat: 23.89246790936712, lng: 121.54415209166598 };
var polygon = { coords: [], checkPolygon: false };

//Static directory
app.use(express.static("public"));

// Parse incoming JSON requests
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

var loggedIn = false;

//Initial loader
app.get("/", function (req, res) {
  // res.render("index.ejs");
  res.redirect("/login-page");
});

//Login page loader
app.get("/login-page", function (req, res) {
  res.render("login.ejs", { errorLogin: 0 });
});

//Login handler
app.post("/login", function (req, res) {
  if (req.body.user == "test" && req.body.psw == "1234") {
    res.redirect("/app");
    loggedIn = true;
  } else res.render("login.ejs", { errorLogin: 1 });
});

//Post-login error handler
app.get("/login", function (req, res) {
  res.redirect("/");
});

//Logout handler
app.get("/logout", function (req, res) {
  loggedIn = false;
  res.redirect("/");
});

//Main handler
app.get("/app", function (req, res) {
  if (loggedIn)
    res.render("index.ejs");
  else res.redirect("/");
});

//Send data with URL query handler
//url: .../send?data=test-data
// app.get("/send", function (req, res) {
//   if (req.query.data == "") {
//     console.log("No data sent by ESP32");
//     res.send("No data sent!");
//   } else {
//     res.send(`Sent data: ${req.query.lat}, ${req.query.lng}, ${req.query.time}`);
//     loc.lat = req.query.lat;
//     loc.lng = req.query.lng;
//     console.log(req.query);

//     posCount++;
//     let tempPos = { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng), order: posCount };
//     posLog.push(tempPos);
//     console.log(posLog);
//   }
// });

// send to database
app.get("/send", function (req, res) {
  if (req.query.data == "") {
    console.log("No data sent by ESP32");
    res.send("No data sent!");
  } else {
    res.send(`Sent data:${req.query.bn}, ${req.query.lat}, ${req.query.lng}`);

    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Months are zero-based, so January is 0
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    const currentDateAndTime = `${year}-${month}-${date} ${hour}:${minute}:${second}`;
    console.log(currentDateAndTime);

    const newdata = lib.createData(req.query.bn, parseFloat(req.query.lat), parseFloat(req.query.lng), currentDateAndTime);
    console.log("New Data");
  }
});

//Pass data to js file
app.get("/get-loc", function (req, res) {
  res.json(loc);
});

//Pass table data to js file
app.get("/get-tableData", async function (req, res) {
  const data = await lib.getAllLastData();
  res.json(data);
});

//Handle incoming manually updated data
app.get("/updateData", function (req, res) {
  loc = req.query;
  posCount++;
  let tempPos = { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng), order: posCount };
  posLog.push(tempPos);
  console.log(posLog);
});

app.post("/DataNum", async function (req, res) {
  // ini kenapa cok kok req.board_number undefine
  // console.log(req.board_number);
  // const parsed = JSON.parse(req.body);
  // console.log(parsed);
  const data = await lib.getAllDataofBoard(req.body.bn);
  res.json(data);
});

// Endpoint to handle the incoming data from index.js
app.post("/api/endpoint", (req, res) => {
  polygon.coords = req.body.coords;
  polygon.checkPolygon = true;
  console.log("");
  console.log("Geofence created!");
  console.log("Polygon coordinates:", polygon);

  const responseData = { message: "Data received successfully" };
  res.json(responseData);
});

// Get polygon coords handler
app.get("/api/get-overlay", (req, res) => {
  console.log(polygon);
  const responseData = {
    coords: polygon.coords,
    checkPolygon: polygon.checkPolygon,
  };
  res.json(responseData);
});

//Delete polygon
app.post("/api/delete-polygon", function (req, res) {
  polygon.checkPolygon = false;
  polygon.coords = [];
  console.log("");
  console.log("Geofence deleted!");
  console.log(polygon);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
