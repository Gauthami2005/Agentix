const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, { dbName: 'agentix' })
        .then(() => console.log('⚡ Connected to MongoDB Atlas (agentix)'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
}

const app = require('./app');
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});
