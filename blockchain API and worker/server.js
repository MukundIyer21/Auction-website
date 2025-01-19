const mongoose = require('mongoose');
const config = require('./config/index');
const app = require("./app");

const PORT = process.env.PORT || 3000;

mongoose.connect(config.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});