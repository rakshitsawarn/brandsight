import mongoose from 'mongoose';
// const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  UID: String,
  name: String,
  email: String,
  password: String,
});

// module.exports = mongoose.model('users', userSchema);
const User = mongoose.model('users', userSchema);
export default User;