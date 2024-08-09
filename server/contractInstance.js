const { Web3 } = require("web3");
const { abi: contractABI } = require("./abi");
require('dotenv').config();

let web3;
let contract;

async function initWeb3() {
    web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_NODE_URL));
    contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
}

initWeb3().catch(console.error);

module.exports = {
    contract, web3
};