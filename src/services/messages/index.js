const express = require("express")
const MessageModel = require("./schema")
const messageRouter = express.Router()
//GET all the messages from the room 
messageRouter.get("/:roomName",async(req,res,next) => {
    try {
        const findMessages = await MessageModel.find({room:req.params.roomName})
        res.send(findMessages)
    } catch (error) {
        next(error)
    }
})

module.exports = messageRouter