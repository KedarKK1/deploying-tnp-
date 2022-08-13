require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const studentRouter = require("./routes/studentRoute");
const adminRouter = require("./routes/adminRoute");
const companyRouter = require("./routes/companyRoute");
const cors = require("cors");

const app = express();

const port = process.env.PORT;

// built-in middlewares
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true });

app.use(studentRouter);
app.use(adminRouter);
app.use(companyRouter);

if (process.env.NODE_ENV == "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  })
} else{
  app.get("/", (req, res) => {
    res.send('serveris running')
  })
}

app.listen(port, () => {
  console.log("Server is up on the port : " + port);
});
