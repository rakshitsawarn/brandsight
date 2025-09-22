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


// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   UID: String, // keep UID for consistency with old schema
//   name: { type: String, required: true, trim: true }, // previously 'username'
//   email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//   password: { type: String, required: function () { return !this.authProvider; } },
//   authProvider: String,
//   googleId: String,
//   tokenVersion: { type: Number, default: 0 },
//   currentChatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },
//   role: { type: String, enum: ["user", "admin"], default: "user" }
// }, { timestamps: true });

// const User = mongoose.model("users", userSchema);
// export default User;

