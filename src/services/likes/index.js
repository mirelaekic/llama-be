const express = require("express");
const LikeModel = require("./schema");
const PostModel = require("../posts/schema");
const mongoose = require("mongoose");
const likeRouter = express.Router();

// ROUTES TO LIKE/DISLIKE A POST

likeRouter.post("/:postId", async (req, res, next) => {
  try {
    // find the post with the postId
    const like = await LikeModel.find({
      postId: req.params.postId,
      user: req.user._id,
    });

    if (like[0] === undefined) {
      const like = new LikeModel({
        postId: req.params.postId,
        like: true,
        user: req.user._id,
      });
      await like.save();
      res.send(like);
    } else {
      const like = await LikeModel.findOneAndDelete({ user: req.user._id, postId:req.params.postId });
      res.send(like);
    }
  } catch (error) {
    next(error);
  }
});
likeRouter.get("/", async (req, res, next) => {
  try {
    const likes = await LikeModel.find();
    res.send(likes);
  } catch (error) {
    next(error);
  }
});
likeRouter.get("/:postId", async (req, res, next) => {
  try {
    const likes = await LikeModel.find({ postId: req.params.postId });
    res.send(likes);
  } catch (error) {
    next(error);
  }
});

module.exports = likeRouter;
