const MessageModel = require("../services/messages/schema")

const addMessage = async (sender, room, message) => {
  try {
      console.log(sender,room,message,"SAVING TO MONGO DB")
    const newMessage = await new MessageModel({ text: message, sender, room })
    const savedMessage = await newMessage.save()
    console.log(savedMessage)
    return savedMessage
  } catch (error) {
    console.log(error)
  }
}

module.exports = addMessage