const { Schema, model } = require("mongoose");

const CommentSchema = new Schema({
    comment:String,
    postId:String,
    likes:[],
    userId:String,
},{timestamps:true});

const CommentModel = model("comment",CommentSchema)
module.exports = CommentModel
