const express = require("express");
const ethers = require("ethers");
const {
    queueAddItem,
    queueTransferItem,
    queueDeleteItem,
    getUserItems,
    getOperationStatus
} = require("../services/contractService");

const router = express.Router();

router.post("/item", async (req, res) => {
    try {
        const { seller, item_id } = req.body;
        if (!ethers.utils.isAddress(seller)) {
            return res.status(400).send({
                status: "error",
                message: "Invalid Seller Ethereum address"
            });
        }

        const operationId = await queueAddItem(seller, item_id);
        res.send({
            status: "pending",
            operation_id: operationId,
            message: "Item addition queued for processing"
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: error.message
        });
    }
});

router.delete("/item/:item_id", async (req, res) => {
    try {
        const { item_id } = req.params;
        const owner = req.body.seller;

        if (!ethers.utils.isAddress(owner)) {
            return res.status(400).send({
                status: "error",
                message: "Invalid Seller Ethereum address"
            });
        }

        const operationId = await queueDeleteItem(owner, item_id);
        res.send({
            status: "pending",
            operation_id: operationId,
            message: "Item deletion queued for processing"
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: error.message
        });
    }
});

router.post("/transfer", async (req, res) => {
    try {
        const { buyer: to, item_id } = req.body;
        if (!ethers.utils.isAddress(to)) {
            return res.status(400).send({
                status: "error",
                message: "Invalid Buyer Ethereum address"
            });
        }
        const operationId = await queueTransferItem(to, item_id);
        res.send({
            status: "pending",
            operation_id: operationId,
            message: "Item transfer queued for processing"
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: error.message
        });
    }
});

router.get("/userItems/:user", async (req, res) => {
    try {
        const user = req.params.user;
        const items = await getUserItems(user);
        res.send({
            status: "success",
            items
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: error.message
        });
    }
});

module.exports = router;