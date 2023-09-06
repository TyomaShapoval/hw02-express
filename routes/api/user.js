const express = require('express')
const usersRouter = express.Router()
const jwt = require('jsonwebtoken')
const path = require('path');
const {nanoid} = require('nanoid')

const User = require('../../model/users')
const multer = require('multer');
require('dotenv').config()
const auth = require('../../middlewares/auth')
const gravatar = require('gravatar');
const Jimp = require('jimp')
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
	username: 'KeyTeam',
	key: `${process.env.PRIVATE_API_SEND}`,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, `../../tmp`));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 1048576,
  },
});

const upload = multer({
  storage: storage,
});

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
      const verify = false;
      const verificationToken = nanoid();
      const link = `http://localhost:3000/api/users/verify/${verificationToken}`;
      const avatarURL = gravatar.url(email, {protocol: 'https', s: '100'});
      const newUser = new User({ username, email, avatarURL, verify, verificationToken })
      if (password.length < 6) {
        return res.status(400).json({
          status: 'Bad Request',
          code: 400,
          message: 'Validation Err',
        })
      }
      newUser.setPassword(password)
      await newUser.save()
      
    mg.messages.create('sandboxd1809d020dc14242af775714fb84cc87.mailgun.org', {
		from: "shapoval1044@gmail.com",
		to: [`${email}`],
		subject: "Go verify, bro",
		html: `<p>Click on the link to verify your email address: <a target="_blank" href=${link}>VERIFICATION LINK</a></p>`,
	}).then(msg => console.log(msg))
	.catch(err => console.log(err));

      res.status(201).json({
        status: '201 Created',
        ResponseBody: {
            "user": {
              "email": email,
              "subscription": subscription,
              "avatar": avatarURL,
              "verify": verify,
              "verificationToken": verificationToken
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

  usersRouter.patch("/avatars", auth, upload.single('image'), async (req, res, next) => {
    console.log('file', req.file)
    const ImgPath = ('public/avatars/IMG_' + Math.floor(Math.random()*1e9) + req.file.originalname )
    Jimp.read(req.file.path, (err, img) => {
      if (err) throw err;
      img
        .resize(250, 250)
        .write(ImgPath, (err) => {
          if (err) throw err;
          console.log('Зображення збережено!');
      });
    });

    const { _id } = req.user;
  
    await User.findByIdAndUpdate(_id, { avatarURL: ImgPath.slice(6) });

    return res.status(200).json({
      status: "200 OK",
      code: 200,
      ResponseBody: {
        "avatarURL": ImgPath.slice(6)
      }
    });
  });

  usersRouter.get('/verify/:verificationToken', async (req, res) => {
    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({
        status: '404 Not Found',
        ResponseBody: {
          "message": "User not found"
        },
      })    
    }
  
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
  
    res.json({
      status: "OK",
      code: 200,
      message: "Verification successful",
    });
    
  }
  );
  
  usersRouter.post('/verify', async (req, res) => {

    const {email} = req.body

    if (!email) {
      return res.json({
        code: 400,
        message: "missing required field email"
      })
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({
        status: 404,
        code: 404,
        message: "Not Found"
      })
    }

    if (user.verify) {
      return res.json({
        code: 400,
        message: "Verification has already been passed"
      })
    }

    const link = `http://localhost:3000/api/users/verify/${user.verificationToken}`;

    mg.messages.create('sandboxd1809d020dc14242af775714fb84cc87.mailgun.org', {
      from: "shapoval1044@gmail.com",
      to: [`${email}`],
      subject: "Go verify, bro",
      html: `<p>Click on the link to verify your email address: <a target="_blank" href=${link}>VERIFICATION LINK</a></p>`,
    }).then(msg => console.log(msg))
    .catch(err => console.log(err));

    return res.json({
      RequestBody: {
        "email": email
      }
    })

  });

  module.exports = usersRouter