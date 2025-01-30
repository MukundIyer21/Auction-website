const { ethers } = require("ethers");
const crypto = require('crypto');
const config = require("../config/index");
const abiFile = require("../abi/ItemManagement.json");
const { addToQueue, QUEUES } = require('../redis/client');
const Operation = require('../models/Operation');

const provider = new ethers.providers.JsonRpcProvider(config.polygon.rpcUrl);
const wallet = new ethers.Wallet(config.polygon.privateKey, provider);
const contract = new ethers.Contract(config.polygon.contractAddress, abiFile.abi, wallet);

async function executeWithGasEstimate(methodName, params) {
    try {
        const currentGasPrice = await provider.getGasPrice();
        const estimatedGas = await contract.estimateGas[methodName](...params);
        const gasLimit = estimatedGas.mul(ethers.BigNumber.from(12)).div(ethers.BigNumber.from(10));
        const finalGasPrice = currentGasPrice.mul(ethers.BigNumber.from(110)).div(ethers.BigNumber.from(100));

        const tx = await contract[methodName](...params, {
            gasLimit: gasLimit,
            gasPrice: finalGasPrice
        });

        const receipt = await tx.wait(1);
        if (receipt.status === 0) {
            throw new Error('Transaction failed');
        }
        return receipt;
    } catch (error) {
        console.error(`Error executing ${methodName}:`, error);
        throw error;
    }
}

const canAddItem = async (owner, itemId) => {
    try {
        const [isValid, errorMessage] = await contract.canAddItem(owner, itemId);
        return { isValid, errorMessage };
    } catch (error) {
        console.error('Error in canAddItem validation:', error);
        throw error;
    }
};

const canTransferItem = async (to, itemId) => {
    try {
        const [isValid, errorMessage] = await contract.canTransferItem(to, itemId);
        return { isValid, errorMessage };
    } catch (error) {
        console.error('Error in canTransferItem validation:', error);
        throw error;
    }
};

const canDeleteItem = async (owner, itemId) => {
    try {
        const [isValid, errorMessage] = await contract.canDeleteItem(owner, itemId);
        return { isValid, errorMessage };
    } catch (error) {
        console.error('Error in canDeleteItem validation:', error);
        throw error;
    }
};

const executeAddItem = async (owner, itemId) => {
    try {
        console.log("Executing add item...");
        return await executeWithGasEstimate('executeAddItem', [owner, itemId]);
    } catch (error) {
        console.error('Error in executeAddItem:', error);
        throw error;
    }
};

const executeTransferItem = async (to, itemId) => {
    try {
        return await executeWithGasEstimate('executeTransferItem', [to, itemId]);
    } catch (error) {
        console.error('Error in executeTransferItem:', error);
        throw error;
    }
};

const executeDeleteItem = async (owner, itemId) => {
    try {
        return await executeWithGasEstimate('executeDeleteItem', [owner, itemId]);
    } catch (error) {
        console.error('Error in executeDeleteItem:', error);
        throw error;
    }
};

const queueAddItem = async (owner, itemId) => {
    const { isValid, errorMessage } = await canAddItem(owner, itemId);
    if (!isValid) {
        throw new Error(errorMessage);
    }

    const operationId = crypto.randomUUID();
    const operation = new Operation({
        operation_id: operationId,
        type: 'ADD',
        params: { owner, item_id: itemId }
    });

    await operation.save();
    await addToQueue(QUEUES.ITEM_OPERATIONS, {
        operationId,
        type: 'ADD',
        params: { owner, itemId }
    });

    return operationId;
};

const queueTransferItem = async (to, itemId) => {
    const { isValid, errorMessage } = await canTransferItem(to, itemId);
    if (!isValid) {
        throw new Error(errorMessage);
    }

    const operationId = crypto.randomUUID();
    const operation = new Operation({
        operation_id: operationId,
        type: 'TRANSFER',
        params: { to, item_id: itemId }
    });

    await operation.save();
    await addToQueue(QUEUES.ITEM_OPERATIONS, {
        operationId,
        type: 'TRANSFER',
        params: { to, itemId }
    });

    return operationId;
};

const queueDeleteItem = async (owner, itemId) => {
    const { isValid, errorMessage } = await canDeleteItem(owner, itemId);
    if (!isValid) {
        throw new Error(errorMessage);
    }

    const operationId = crypto.randomUUID();
    const operation = new Operation({
        operation_id: operationId,
        type: 'DELETE',
        params: { owner, item_id: itemId }
    });

    await operation.save();
    await addToQueue(QUEUES.ITEM_OPERATIONS, {
        operationId,
        type: 'DELETE',
        params: { owner, itemId }
    });

    return operationId;
};

const getUserItems = async (user) => {
    try {
        return await contract.getUserItems(user);
    } catch (error) {
        console.error('Error in getUserItems:', error);
        throw error;
    }
};

const getOperationStatus = async (operationId) => {
    const operation = await Operation.findOne({ operation_id: operationId });
    if (!operation) {
        throw new Error('Operation not found');
    }
    return operation;
};

module.exports = {
    canAddItem,
    canTransferItem,
    canDeleteItem,
    executeAddItem,
    executeTransferItem,
    executeDeleteItem,
    queueAddItem,
    queueTransferItem,
    queueDeleteItem,
    getUserItems,
    getOperationStatus
};