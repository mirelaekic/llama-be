const express = require("express");
const cors = require("cors");
const {join} = require("path");
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const {authorize} = require("./services/auth/middleware")
const usersRouter = require("./services/users");
const postsRouter = require("./services/posts")
const commentsRouter = require("./services/comments")
const likeRouter = require("./services/likes")
const commentLikeRouter = require("./services/commentLike")

require("dotenv/config");
const {
    notFoundHandler,
    forbiddenHandler,
    badRequestHandler,
    genericErrorHandler,
  } = require("./errorHandlers")

const server = express();

const io = require('socket.io')(5000)

io.on('connection', socket => {
  const id = socket.handshake.query.id
  socket.join(id)

  socket.on('send-message', ({ recipients, text }) => {
    recipients.forEach(recipient => {
      const newRecipients = recipients.filter(r => r !== recipient)
      newRecipients.push(id)
      socket.broadcast.to(recipient).emit('receive-message', {
        recipients: newRecipients, sender: id, text
      })
    })
  })
})
// const whitelist = ["http://localhost:3000","http://localhost:3001","http://localhost:3012"]
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true)
//     } else {
//       callback(new Error("Not allowed by CORS"))
//     }
//   },
//   credentials: true,
// }

server.use(cors());

const port = process.env.PORT;
const staticFolderPath = join(__dirname, "../public")

server.use(express.static(staticFolderPath))
server.use(express.json())
server.use(cookieParser())

server.use("/users", usersRouter)
server.use("/posts",authorize, postsRouter)
server.use("/comments", authorize, commentsRouter)
server.use("/like", authorize, likeRouter)
server.use("/commentLike", authorize, commentLikeRouter)

server.use(badRequestHandler)
server.use(forbiddenHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server))

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    server.listen(port, () => {
      console.log("Running on port", port)
    })
  )
  .catch(err => console.log(err))