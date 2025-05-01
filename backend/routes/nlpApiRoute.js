import express from 'express';
// const express = require('express');
const router = express.Router();
// const { analyze } = require('../controllers/nlpApiController');
import { analyze } from '../controllers/nlpApiController.js';

router.post('/analyze', analyze);

// module.exports = router;
export default router;
