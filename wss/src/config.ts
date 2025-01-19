import dotenv from "dotenv";
dotenv.config();

const config = {
  redis: {
    url: "redis://localhost:6380",
  },
};

export default config;
