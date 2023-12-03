import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 3000;
var temp = "";
var loc = { lat: 23.89246790936712, lng: 121.54415209166598 };

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
  if (loggedIn) res.render("index.ejs");
  else res.redirect("/");
});

//Send data with URL query handler
//url: .../send?data=test-data
app.get("/send", function (req, res) {
  if (req.query.data == "") {
    console.log("No data sent by ESP32");
    res.send("No data sent!");
  } else {
    res.send(`Sent data: ${req.query.lat}, ${req.query.lng}, ${req.query.time}`);
    loc.lat = req.query.lat;
    loc.lng = req.query.lng;
    console.log(req.query);
  }
});

//Pass data to js file
app.get("/get-loc", function (req, res) {
  res.json(loc);
});

//Handle incoming manually updated data
app.get("/updateData", function (req, res) {
  loc = req.query;
});

// Endpoint to handle the incoming data from index.js
app.post("/api/endpoint", (req, res) => {
  const receivedData = req.body;
  console.log("Data received from client:", receivedData);

  const responseData = { message: "Data received successfully" };
  res.json(responseData);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
