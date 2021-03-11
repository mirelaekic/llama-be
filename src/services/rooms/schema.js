const { Schema, model } = require("mongoose")

const RoomSchema = new Schema({
  name: String,
  members: [{ username: String, userId: String }],
})
const RoomModel = model("Room", RoomSchema)
module.exports = RoomModel