const socketio = require("socket.io")
// GET ALL ROOMS THEN FILTER THEM BY THE CURRENT USERS ID 
const {
  addUserToRoom,
  getUsersInRoom,
  getUserBySocket,
  removeUserFromRoom,
} = require("./utils/users")
const addMessage = require("./utils/messages")

const createSocketServer = server => {
  const io = socketio(server)

  io.on("connection", socket => {
    console.log(`New socket connection --> ${socket.id}`)

    socket.on("joinRoom", async data => {
      try {
          //USER ID WHEN CONNECTING 8APvD5PggExv4rOaAAAL name:mirela
          console.log(data,"user that is joining the room")

        // add user to specified room (in mongo)
        console.log(socket.id,"THE USERS ID WHEN HE JOINS THE ROOM")
        const { username, room, userId } = await addUserToRoom({
          ...data,
        })
        socket.join(room)

        const messageToRoomMembers = {
          sender: "Admin",
          text: `${username} has joined the room!`,
          createdAt: new Date(),
        }

        socket.broadcast.to(room).emit("message", messageToRoomMembers) // sending the message to all the users connected in the room

        // send rooms info (users list) to all users
        const roomMembers = await getUsersInRoom(room)
        console.log(room,"THE ROOM")
        io.to(room).emit("roomData", { room, users: roomMembers })
      } catch (error) {
        console.log(error)
      }
    }) // joining chat room
    socket.on('notification',async (data) => {
      try {
        console.log(data,"the data")
        const notificationMessage = {
          sender:data.sender,
          text: `invited you to ${data.place} at ${data.time}`
        }
        console.log(notificationMessage,"the notif msg")
        data.users.map((u) => {
          return io.to(u).emit("notification",notificationMessage)
        })
        
      } catch (error) {
        console.log(error)
      }
  });
    socket.on("sendMessage", async ({ room, message,userId }) => {
      // when a client sends a message
        //console.log(socket.id,"THIS ID USER SHOULD MATCH FROM SEND MESSSAGE")
      // search in the room for that user (search by socket.id)
      const user = await getUserBySocket(room, userId)
      console.log(user,"comparing the user to the user id from FE")
        //BSk-Z03R825wr11YAAAB 
        //BSk-Z03R825wr11YAAAB
      const messageContent = {
        text: message,
        sender: user.username,
        room,
      }
      console.log(messageContent,"message content")
      // save message in db
      await addMessage(messageContent.sender, room, messageContent.text)

      // send the message to all the people in that room
      io.to(room).emit("message", messageContent)
    })
    socket.on("leaveRoom", async ({ room }) => {
      // when a client leaves chat room

      try {
        // Remove socketid from room in db

        const username = await removeUserFromRoom(socket.id, room)

        const messageToRoomMembers = {
          sender: "Admin",
          text: `${username} has left`,
          createdAt: new Date(),
        }
        io.to(room).emit("message", messageToRoomMembers)

        // send rooms info (users list) to all users
        const roomMembers = await getUsersInRoom(room)
        io.to(room).emit("roomData", { room, users: roomMembers })
      } catch (error) {
        console.log(error)
      }
    })
  })
}

module.exports = createSocketServer