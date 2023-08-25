const express = require("express");
const bcrypt = require("bcryptjs");

const authRouter = express.Router();

const { User } = require("../../models/users");

const signup = async (req, res) => {
  const { email, password, subscription } = req.body;
  console.log(req)

  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      message: "Email is already in use",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashPassword,
    subscription,
  });

  res.status(201).json({
    status: "Success",
    code: 201,
    message: "User was created",
    data: {
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    },
  });
};

authRouter.post("/register", signup);

module.exports = authRouter;
