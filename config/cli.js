var cli = require("cli-color");
exports.console = {
  blue: function(string) {
    console.log(cli.blue(string));
  },
  red: function(string) {
    console.log(cli.red(string));
  },
  green: function(string) {
    console.log(cli.green(string));
  },
  yellow: function(string) {
    console.log(cli.yellow(string));
  }
};
