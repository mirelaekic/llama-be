const express = require("express");
const CommentModel = require("./schema");
const PostModel = require("../posts/schema");
const mongoose = require("mongoose");
const commentRouter = express.Router();

// get all comments for one specific post DONE
commentRouter.get("/:postId", async (req, res, next) => {
  try {
    const comments = await CommentModel.find({ postId: req.params.postId });
    res.send(comments);
  } catch (error) {
    next(error);
  }
});
// get one comment for one post DONE
commentRouter.get("/:id", async (req, res, next) => {
  try {
    const comment = await CommentModel.findById(req.params.id);
    res.send(comment);
  } catch (error) {
    next(error);
  }
});
// post comment for one post DONE
commentRouter.post("/:postId", async (req, res, next) => {
  try {
    const newComment = await new CommentModel({
      ...req.body,
      userId: req.user._id,
      postId: req.params.postId,
    });
    const { _id } = await newComment.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
// only edit comments that user has written DONE
commentRouter.put("/:postId/:commentId", async (req, res, next) => {
  try {
    const comment = await CommentModel.findOneAndUpdate(
      { _id: req.params.commentId, userId: req.user._id},
      { ...req.body },
      { findOneAndUpdate: true }
    );
    console.log(comment,"COMMENT")
    const saved = await comment.save();
    res.send(saved);
  } catch (error) {
    next(error);
  }
});
// only delete comments that user has written DONE
commentRouter.delete("/:postId/:commentId", async (req, res, next) => {
  try {
    const userID = req.user._id === userId
    const comment = await CommentModel.findOneAndDelete(req.params.commentId,req.params.postId,{userId:userID});
    console.log(comment,"COMMENT TO DELETE")
    res.send(comment);
  } catch (error) {
    next(error);
  }
});

module.exports = commentRouter;
