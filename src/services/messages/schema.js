const { Schema, model } = require("mongoose")

const MessageSchema = new Schema({
  text: String,
  sender: String,
  room: String,
})

const MessageModel = model("Message", MessageSchema)
module.exports = MessageModel