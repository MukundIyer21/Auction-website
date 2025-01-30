import axios from "axios";
import { transferSchedulerConfig } from "./config";
import { transferSchedulerData } from "./types";

export const scheduleTransfer = async (data: transferSchedulerData): Promise<void> => {
  try {
    await axios.post(transferSchedulerConfig.base_uri, data);
  } catch (error: any) {
    if (error.response) {
      console.error("Error response:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
  }
};
