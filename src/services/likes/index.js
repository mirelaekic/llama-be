const express = require("express");
const LikeModel = require("./schema");
const PostModel = require("../posts/schema");
const mongoose = require("mongoose");
const likeRouter = express.Router();

// ROUTES TO LIKE/DISLIKE A POST

likeRouter.post("/:postId", async (req, res, next) => {
  try {
      // find the post with the postId
    const like = await LikeModel.find({ postId: req.params.postId ,user:req.user._id});
    console.log(like,"if like found")
    
  if (like[0] === undefined)  {
    const like = new LikeModel({
        postId: req.params.postId,
        like: true,
        user: req.user._id,
      });
      const post = await PostModel.findByIdAndUpdate(
        req.params.postId,
        {
          $push: { likes: like },
        },
        { runValidators: true, new: true }
      );
      await like.save();
      res.send(post);
    } else {
       console.log("you have to dislike")
    const like = await LikeModel.findOneAndDelete({ user: req.user._id });
    console.log(like,"LIKE")
    const removeFromPost = await PostModel.findByIdAndUpdate(
        req.params.postId,
        {
          $pull: { likes: { _id: mongoose.Types.ObjectId(like._id) } },
        },
        {
          runValidators: true,
          new: true,
        }
      );
      res.send(removeFromPost.likes); 
    }
  } catch (error) {
    next(error);
  }
});

likeRouter.get("/:postId", async (req, res, next) => {
    try {
        const likes = await LikeModel.find({ postId: req.params.postId});
        res.send(likes)
    } catch (error) {
        next(error)
    }
});

module.exports = likeRouter;
