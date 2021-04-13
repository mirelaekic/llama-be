const express = require("express");
const RoomModel = require("./schema");
const roomRouter = express.Router();


roomRouter.get("/",async (req,res,next) => {
    try {
        const rooms = await RoomModel.find()
        res.send(rooms)
    } catch (error) {
        next(error)
    }
})

//get all the rooms by user id
roomRouter.get("/me",async (req,res,next) => {
    try {
        const user = req.user._id;
        const rooms = await RoomModel.find({"members.userId" : user})
        console.log(rooms,"if the user is in any of rooms")
        res.send(rooms)
    } catch (error) {
        next(error)
    }
})
// get room by ID
roomRouter.get("/:id",async (req,res,next) => {
    try {
        const room = await RoomModel.findById(req.params.id)
        console.log(room,"only one room")
        res.send(room)
    } catch (error) {
        next(error)
    }
})


module.exports = roomRouter