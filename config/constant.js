const dev = {
  dbUrl: "mongodb://localhost:27017/bottest",
  PORT: process.env.PORT || 4000
};

// const prod = {
//   dbUrl: "mongodb://localhost:27017/katcha_db",
//   PORT: process.env.PORT || 4000
// };

module.exports = process.env.NODE_ENV === "prod" ? prod : dev;
