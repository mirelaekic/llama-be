const express = require("express");
const cors = require("cors");
const { join } = require("path");
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
//const http = require("http");
const passport = require("passport")
const cookieParser = require("cookie-parser");

require("./services/auth/oauth")

const { authorize } = require("./services/auth/middleware");
const usersRouter = require("./services/users");
const postsRouter = require("./services/posts");
const commentsRouter = require("./services/comments");
const likeRouter = require("./services/likes");
const commentLikeRouter = require("./services/commentLike");
//const messageRouter = require("./services/messages");
//const roomRouter = require("./services/rooms")

require("dotenv/config");

const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers");

//const createSocketServer = require("./socket");
const server = express();
// const httpServer = http.createServer(server);
// createSocketServer(httpServer);
server.set("trust proxy", 1);
server.enable("trust proxy");
server.use(express.json());
// server.use(
//   cors({
//     origin: [
//       `${process.env.FE_URL}`,
//       "http://localhost:3000/",
//     ],
//     exposedHeaders: ["set-cookie"],
//   })
// );
server.use(cors({credentials: true, origin: process.env.FE_URL}));
const port = process.env.PORT;
const staticFolderPath = join(__dirname, "../public");

server.use(express.static(staticFolderPath));
server.use(express.json());
server.use(cookieParser());
server.use(passport.initialize());
server.use(passport.session());

server.use("/users", usersRouter);
server.use("/posts", authorize, postsRouter);
server.use("/comments", authorize, commentsRouter);
server.use("/like", authorize, likeRouter);
server.use("/commentLike", authorize, commentLikeRouter);
//server.use("/messages",authorize, messageRouter);
//server.use("/rooms",authorize, roomRouter)

server.use(badRequestHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    server.listen(port, () => {
      console.log("Running on port", port);
    })
  )
  .catch((err) => console.log(err));
