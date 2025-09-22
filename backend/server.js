import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import userRoutes from './routes/userRoute.js';
import nlpApiRoutes from './routes/nlpApiRoute.js';

//new
import authRoutes from './routes/authRoutes.js';

// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors');

dotenv.config();

// MongoDB 
mongoose.connect(process.env.MONGO_URI_Local)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error(err));

// Expresss App Initailized
const app = express();
app.use(cors());
app.use(express.json());

//Default Route
app.get('/', (req, res)=>{
    res.send("Backend is Running...");
});

// Main Routes
app.use('/api/users', userRoutes);
app.use('/api/nlpApi', nlpApiRoutes);

// new
app.use("/api/auth", authRoutes);

// app.use('/api/users', require('./routes/userRoute'));
// app.use('/api/nlpApi', require('./routes/nlpApiRoute'));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});
  