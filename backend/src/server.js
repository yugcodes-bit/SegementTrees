require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Import our new routes
const eventRoutes = require('./routes/eventRoutes');

// Mount the routes
app.use('/api/events', eventRoutes);

// Simple Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'success', message: 'Smart Seat API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Smart Seat Server running on http://localhost:${PORT}`);
});