import express from "express";
import { addJob } from "./bull";
const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const { delay, ...jobData } = req.body;
    if (typeof delay != "number") {
      res.json({ status: "error", message: "Invalid or missing delay" });
    } else {
      await addJob(jobData, delay);
      console.log("Request with body ", req.body, " handled successfully");
      res.json({ status: "success", message: "Job added successfully" });
    }
  } catch (err) {
    console.log("Error occured:", err);
    res.json({ status: "success", message: "Internal server error" });
  }
});

app.listen("3003", () => {
  console.log("Server listening on port 3003");
});
