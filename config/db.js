const mongoose = require("mongoose");
const constant = require("./constant");
const cli = require("./cli").console;
let options = {
  poolSize: 2,
  promiseLibrary: global.Promise
};
mongoose.set('debug', true)
mongoose.connect(constant.dbUrl, options, function (err) {
  if (err) {
    cli.red("Database not connected");
  } else {
    cli.green("Success! DB connected Succesfully.");

  }
});
