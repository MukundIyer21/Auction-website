require("dotenv").config({ path: "../server/.env" }); // Specify the .env file location
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);

    // Deploy the ItemManagement contract
    const ItemManagement = await ethers.getContractFactory("ItemManagement");
    const contract = await ItemManagement.deploy();
    await contract.deployed();

    console.log("Contract deployed at:", contract.address);

    // Paths for the server's .env file and ABI file
    const envFilePath = path.resolve(__dirname, "../../server/.env");
    const abiFilePath = path.resolve(__dirname, "../../server/abi/ItemManagement.json");

    // Update the .env file with the contract address
    updateEnvFile(envFilePath, contract.address);

    // Write the ABI to the JSON file
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

    // Regex to match the CONTRACT_ADDRESS key
    const contractAddressRegex = /^CONTRACT_ADDRESS=.*$/m;

    if (contractAddressRegex.test(envContent)) {
        // Replace existing contract address
        envContent = envContent.replace(contractAddressRegex, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
        // Append contract address if not present
        envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envFilePath, envContent, "utf8");
    console.log("Updated .env file with the contract address.");
}

/**
 * Writes the ABI of the deployed contract to a JSON file.
 * @param {string} abiFilePath - Path to the ABI file.
 * @param {string} abi - ABI of the contract.
 */
function updateAbiFile(abiFilePath, abi) {
    try {
        const abiData = {
            contractName: "ItemManagement",
            abi: JSON.parse(abi),
        };

        // Ensure directory exists
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

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contract:", error.message);
        process.exit(1);
    });
