const express = require("express");
const CommentModel = require("../comments/schema")
const CommentLikeModel = require("./schema")
const mongoose = require("mongoose");
const commentLikeRouter = express.Router();

//ROUTES TO LIKE/DISLIKE A COMMENT
commentLikeRouter.post("/:commentId", async (req, res, next) => {
    try {
        // find the post with the postId
      const like = await CommentLikeModel.find({ commentId: req.params.commentId ,user:req.user._id});
    if (like[0] === undefined)  {
      const like = new CommentLikeModel({
          commentId: req.params.commentId,
          like: true,
          user: req.user._id,
        });
        const post = await CommentModel.findByIdAndUpdate(
          req.params.commentId,
          {
            $push: { likes: like },
          },
          { runValidators: true, new: true }
        );
        await like.save();
        res.send(post);
      } else {
      const like = await CommentLikeModel.findOneAndDelete({ user: req.user._id });
      const removeFromComment = await CommentModel.findByIdAndUpdate(
          req.params.commentId,
          {
            $pull: { likes: { _id: mongoose.Types.ObjectId(like._id) } },
          },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(removeFromComment.likes); 
      }
    } catch (error) {
      next(error);
    }
  });
  
  commentLikeRouter.get("/:commentId", async (req, res, next) => {
      try {
          const likes = await CommentLikeModel.find({ commentId: req.params.commentId});
          res.send(likes)
      } catch (error) {
          next(error)
      }
  });


module.exports = commentLikeRouter;
