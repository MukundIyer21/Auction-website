require("dotenv").config({ path: "../server/.env" }); // Specify the .env file location
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);

    const ItemManagement = await ethers.getContractFactory("ItemManagement");
    const contract = await ItemManagement.deploy();
    await contract.deployed();

    console.log("Contract deployed at:", contract.address);

    const envFilePath = path.resolve(__dirname, "../../server/.env");
    const abiFilePath = path.resolve(__dirname, "../../server/abi/ItemManagement.json");

    updateEnvFile(envFilePath, contract.address);

    updateAbiFile(abiFilePath, ItemManagement.interface.format(ethers.utils.FormatTypes.json));

    console.log("Contract address and ABI have been successfully updated.");
}

/**
 * Updates the .env file with the deployed contract address.
 * @param {string} envFilePath - Path to the .env file.
 * @param {string} contractAddress - The deployed contract address.
 */
function updateEnvFile(envFilePath, contractAddress) {
    let envContent = "";

    try {
        envContent = fs.readFileSync(envFilePath, "utf8");
    } catch (error) {
        console.warn(".env file not found. Creating a new one.");
    }

    const contractAddressRegex = /^CONTRACT_ADDRESS=.*$/m;

    if (contractAddressRegex.test(envContent)) {
        envContent = envContent.replace(contractAddressRegex, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
        envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envFilePath, envContent, "utf8");
    console.log("Updated .env file with the contract address.");
}

function updateAbiFile(abiFilePath, abi) {
    try {
        const abiData = {
            contractName: "ItemManagement",
            abi: JSON.parse(abi),
        };

        const dir = path.dirname(abiFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(abiFilePath, JSON.stringify(abiData, null, 2), "utf8");
        console.log("Updated ABI in ItemManagement.json.");
    } catch (error) {
        console.error("Error updating ABI file:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contract:", error.message);
        process.exit(1);
    });
