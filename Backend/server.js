const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');

app.use('/api/auth', authRoutes);
app.use('/api', complaintsRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Complaints Registration Platform API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
