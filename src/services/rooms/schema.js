const { Schema, model } = require("mongoose")

const RoomSchema = new Schema({
  name: String,
  members: [{ username: String, userId: String }],
})
RoomSchema.methods.toJSON = function () {
  const room = this;
  const roomToObject = room.toObject();
  console.log(roomToObject, "the members")
 // delete userObject;

  return roomToObject;
};
const RoomModel = model("Room", RoomSchema)
module.exports = RoomModel