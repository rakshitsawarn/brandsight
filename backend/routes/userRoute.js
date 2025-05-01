import express from 'express';
// const express = require('express');
const router = express.Router();
// const { registerUser, getUserData, getHistory } = require('../controllers/userController');
import { registerUser, getUserData, getHistory } from '../controllers/userController.js';


router.post('/registerUser', registerUser);

router.post('/getUserData', getUserData);

router.post('/getHistory', getHistory);

// module.exports = router;
export default router;

