const jwt = require("jsonwebtoken");

const User = require("../model/users");

const auth = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const errorData = { 
      status: '401 Unauthorized',
      code: 401,
      message: 'Not authorized',
    };
  const [bearer, token] = authorization.split(" ");
  try {
    if (bearer !== "Bearer" || !token) {
        return res.status(401).json(errorData);
    }
    const { id } = jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({_id: id});
    if (!user || !user.token || user.token !== token) {
        return res.status(401).json(errorData);
    }
    if (!user.verify) {
      return res.status(401).json({
        status: '401 Unauthorized',
        code: 401,
        message: 'No verify',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    next(res.status(401).json(error));
  }
};

module.exports = auth;