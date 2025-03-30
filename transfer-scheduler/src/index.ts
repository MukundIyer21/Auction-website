import express from "express";
import { addJob } from "./bull";
import { schedulerPort } from "./config";
const app = express();
app.use(express.json());

const port = schedulerPort;

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
    res.json({ status: "error", message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log("Server listening on port", port);
});
