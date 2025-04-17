const express = require('express');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// MongoDB 
mongoose.connect(process.env.MONGO_URI)
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
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/nlpModel', require('./routes/nlpApiRoute'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
