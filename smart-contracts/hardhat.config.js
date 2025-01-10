require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygonTestnet: {
      url: process.env.POLYGON_AMOY_URL,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
};
