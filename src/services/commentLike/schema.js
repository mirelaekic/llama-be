const {Schema,model} = require("mongoose")

const CommentLikeSchema = new Schema({
    commentId:String,
    like:Boolean,
    user:String,
})

const CommentLikeModel = model("commentLike",CommentLikeSchema)
module.exports = CommentLikeModel