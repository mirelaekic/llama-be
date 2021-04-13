const RoomModel = require("../services/rooms/schema");

const addUserToRoom = async ({ username, userId, room }) => {
  try {
    const RoomExists = await RoomModel.findOne({ name: room });
    console.log(username, userId, room, "COMING FROM SOCKET IO JOIN ROOM");
    console.log(RoomExists,"IF ROOM FOUND")
    if (!RoomExists) {
      const newRoom = await new RoomModel({
        name: room,
        members: { username: username,userId:userId},
      });
      console.log(userId,"SOCKET ID THAT USER GETS WHEN HE CREATES NEW ROOM")
      newRoom.save();
      console.log(newRoom, "USER CREATED NEW ROOM");
    } else {
        // const newRoom = await new RoomModel({name:room})
        // console.log(newRoom.name,"NAME of the new room")
        // check if the user is already in the room if not then add to the room
          const findMembers = await RoomModel.findOne({name:room,"members.userId" : userId})
          console.log(findMembers,"the members and room are matchign")
      // //     if(findMembers){

      // //     }
      // //     const addUserToExisting = await RoomModel.findOneAndUpdate(
      // //   { name:room },
      // //   {
      // //     $addToSet: { members: { username: username, userId: userId } },
      // //   }
      // // );
      // //   console.log(addUserToExisting,"ADD USER IF THE ROOM EXISTS")
}        
    return { username, room };
  } catch (error) {
    console.log(error);
  }
};

const getUsersInRoom = async (roomName) => {
  try {
      console.log(roomName,"GET USERS IN ROOM")
    const room = await RoomModel.findOne({ name: roomName });
    console.log(room.members.length, "members length in the room");
    return room.members;
  } catch (error) {
    console.log(error);
  }
};


const getUserBySocket = async (roomName, userId) => {
  try {
    const room = await RoomModel.findOne({ name: roomName })
    console.log(room,"IF ROOM FOUND")
    console.log(userId,"THE SOCKET ID USER SHOULD MATCH")
    const user = room.members.find(user => user.userId === userId)
    return user
  } catch (error) {
    console.log(error)
  }
}

const removeUserFromRoom = async (userId, roomName) => {
  try {
    const room = await RoomModel.findOne({ name: roomName })

    const username = room.members.find(member => member.userId === userId)

    await RoomModel.findOneAndUpdate(
      { name: roomName },
      { $pull: { members: { userId } } }
    )

    return username
  } catch (error) {}
}

module.exports = {
  addUserToRoom,
  getUsersInRoom,
  getUserBySocket,
  removeUserFromRoom,
}