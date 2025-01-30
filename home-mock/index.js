const express = require("express")
const app = express();

app.get("/home", (req, res) => {
    return res.json({
        status: "success",
        items: [{ item_name: "item1", details: {} },
        { item_name: "item2", details: {} },
        { item_name: "item3", details: {} }]
    })
})

app.listen(3002, (req, res) => {
    console.log("Home Page Service Running On Port 3002")
})