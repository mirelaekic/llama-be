const {Schema,model} = require("mongoose")

const LikeSchema = new Schema({
    postId:String,
    like:Boolean,
    user:String,
})

const LikeModel = model("like",LikeSchema)
module.exports = LikeModel