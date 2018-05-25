const cli = require("cli-color");
exports.console = {
  blue: function(string) {
    console.log(cli.blue.bold(string));
  },
  red: function(string) {
    console.log(cli.red.bold(string));
  },
  green: function(string) {
    console.log(cli.green.bold(string));
  },
  yellow: function(string) {
    console.log(cli.yellow.bold(string));
  },
  cyan: function (string) {
    console.log(cli.cyan.bold(string));
  },
  magenta: function (string) {
    console.log(cli.magenta.bold(string));
  }
};
