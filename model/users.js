const mongoose = require("mongoose");
const bCrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    password: {
      type: String,
      required: [true, 'Set password for user'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter"
    },
    token: String
  },
  { versionKey: false });

userSchema.methods.setPassword = function(password) {
  this.password = bCrypt.hashSync(password, bCrypt.genSaltSync(10));
};

userSchema.methods.validPassword = function(password) {
  return bCrypt.compareSync(password, this.password);
};

const User = mongoose.model("user", userSchema);

module.exports = User;
