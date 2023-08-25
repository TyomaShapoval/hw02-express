const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const connection = mongoose.connect(process.env.DB_HOST)

connection
  .then(() => {
    app.listen(3000, function () {
      console.log(`Database connection successful`)
    })
  })
  .catch((err) => {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
    }
  )
