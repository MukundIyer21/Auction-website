const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
    operationId: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['ADD', 'TRANSFER', 'DELETE'],
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
    },
    params: {
        type: Object,
        required: true,
    },
    error: String,
    transactionHash: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

operationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Operation', operationSchema);