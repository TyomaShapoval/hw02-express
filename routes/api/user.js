const express = require('express')
const usersRouter = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../../model/users')
require('dotenv').config()
const auth = require('../../middlewares/auth')

usersRouter.post('/register', async (req, res, next) => {
    const { username, email, password, subscription = "starter" } = req.body
    const user = await User.findOne({ email })
    if (user) {
      return res.status(409).json({
        status: 'error',
        code: 409,
        message: 'Email is already in use',
        data: 'Conflict',
      })
    }
    try {
      const newUser = new User({ username, email })
      if (password.length < 6) {
        return res.status(400).json({
          status: 'Bad Request',
          code: 400,
          message: 'Validation Err',
        })
      }
      newUser.setPassword(password)
      await newUser.save()
      res.status(201).json({
        status: '201 Created',
        ResponseBody: {
            "user": {
              "email": email,
              "subscription": subscription
            }
          },
      })
    } catch (error) {
      if(error._message) {
        res.status(400).json({
          status: 'Bad Request',
          code: 400,
          message: 'Validation Err',
        })
      }
      console.error(error)
      next(error)
    }
  })

  usersRouter.post('/login', async (req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    const newUser = new User({ password, email })
    const badUser = newUser.validateSync()

    if (badUser) {
      return res.status(400).json({
        status: 'Bad Request',
        code: 400,
        message: 'Validation Err',
      })
    }
  
    if (!user || !user.validPassword(password)) {
      return res.status(401).json({
        status: '401 Unauthorized',
        ResponseBody: {
          "message": "Email or password is wrong"
        },
      })
    }
  
    const payload = {
      id: user.id,
      username: user.username,
    }
  
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' })
    await User.findByIdAndUpdate(user._id, { token })
    res.json({
      status: '200 OK',
      ResponseBody: {
        "token": token,
        "user": {
          "email": email,
          "subscription": user.subscription
        },
    }
    })
  })

  usersRouter.post('/logout', auth, async (req, res) => {
    const { _id } = req.user;
  
    await User.findByIdAndUpdate(_id, { token: null });
  
    res.status(204).json({
      status: "Logout successful",
      code: 204,
    });
  }
  );
  usersRouter.get("/current", auth, async (req, res) => {
    const { email, subscription } = req.user;
  
    res.json({
      code: 200,
      status: "OK",
      userData: {
        email,
        subscription,
      },
    });
  }
  );

  module.exports = usersRouter