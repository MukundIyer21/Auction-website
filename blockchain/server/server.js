const express = require("express");
const app = express();
const PORT = 8220;
const { contract, web3 } = require("./contractInstance");
require('dotenv').config();

const privateKeys = process.env.PRIVATE_KEYS.split(',');
privateKeys.forEach(key => {
    const account = web3.eth.accounts.privateKeyToAccount(key);
    web3.eth.accounts.wallet.add(account);
});

app.use(express.json());

app.get("/test", (req, res) => {
    res.json({ msg: "health is good" })
})

async function sendTransaction(method, ...args) {
    const accounts = await web3.eth.getAccounts();
    const gas = await method(...args).estimateGas({ from: accounts[0] });
    return method(...args).send({ from: accounts[0], gas });
}

app.get('/items/:userId', async (req, res) => {
    try {
        const items = await contract.methods.getItemsForUser(req.params.userId).call();
        res.status(200).json({ items: items.map(item => Number(item)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/items', async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        const result = await sendTransaction(contract.methods.addItemForUser, userId, itemId);
        res.status(200).json({ msg: "items added successfully", transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/history/:itemId', async (req, res) => {
    try {
        const history = await contract.methods.getOwnershipHistoryForItem(req.params.itemId).call();
        res.status(200).json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/transfer', async (req, res) => {
    try {
        const { to, from, itemId } = req.body;
        const result = await sendTransaction(contract.methods.transferItem, to, from, itemId);
        res.status(200).json({ msg: "items transfered successfully", transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log("Server listening port ", PORT);
})