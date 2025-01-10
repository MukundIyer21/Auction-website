const mongoose = require('mongoose');
const { QUEUES, getFromQueue } = require('../redis/client');
const Operation = require('../models/Operation');
const service = require('../services/contractService');
const config = require('../config/index');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processOperation(operation) {
    const { operationId, type, params } = operation;

    try {
        let result;
        switch (type) {
            case 'ADD':
                result = await service.executeAddItem(params.owner, params.itemId);
                break;
            case 'TRANSFER':
                result = await service.executeTransferItem(params.to, params.itemId);
                break;
            case 'DELETE':
                result = await service.executeDeleteItem(params.owner, params.itemId);
                break;
            default:
                throw new Error('Invalid operation type');
        }

        await Operation.findOneAndUpdate(
            { operationId },
            {
                status: 'COMPLETED',
                transactionHash: result.transactionHash
            }
        );
    } catch (error) {
        console.error('Error processing operation:', error);
        await Operation.findOneAndUpdate(
            { operationId },
            {
                status: 'FAILED',
                error: error.message
            }
        );
    }
}

async function startWorker() {
    try {
        await mongoose.connect(config.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Worker connected to MongoDB');

        console.log('Item operation worker started');

        while (true) {
            try {
                const operation = await getFromQueue(QUEUES.ITEM_OPERATIONS);

                if (operation) {
                    await processOperation(operation);
                } else {
                    await sleep(1000);
                }
            } catch (error) {
                console.error('Error processing queue:', error);
                await sleep(1000);
            }
        }
    } catch (error) {
        console.error('Worker failed to start:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Worker: MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Worker: Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});

if (require.main === module) {
    startWorker().catch(error => {
        console.error('Fatal worker error:', error);
        process.exit(1);
    });
}

module.exports = { startWorker };