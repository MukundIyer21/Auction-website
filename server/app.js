const express = require("express");
const bodyParser = require("body-parser");
const itemRoutes = require("./routes/items");

const app = express();
app.use(bodyParser.json());

app.use("/blch", itemRoutes);

module.exports = app;
