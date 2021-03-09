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
    const upload = await PostModel.findByIdAndUpdate(
      req.params.postId,
      {
        $push: { comments: newComment },
      },
      { runValidators: true, new: true }
    );
    const { _id } = await newComment.save();
    res.status(201).send(upload.comments);
  } catch (error) {
    next(error);
  }
});
// only edit comments that user has written DONE
commentRouter.put("/:postId/:commentId", async (req, res, next) => {
  try {
    const comment = await CommentModel.findOneAndUpdate(
      { _id: req.params.commentId },
      { ...req.body },
      { findOneAndUpdate: true }
    );
    const { comments } = await PostModel.findOne(
      { _id: mongoose.Types.ObjectId(req.params.postId) },
      {
        comments: {
          $elemMatch: { _id: mongoose.Types.ObjectId(req.params.commentId) },
        },
      }
    );
    const oldComment = comments[0];
    const modifiedComment = { ...oldComment, ...req.body };
    await PostModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(req.params.postId),
        "comments._id": mongoose.Types.ObjectId(req.params.commentId),
      },
      {
        $set: { "comments.$": modifiedComment },
      },
      { findOneAndUpdate: true }
    );
    const saved = await comment.save();
    res.send(saved);
  } catch (error) {
    next(error);
  }
});
// only delete comments that user has written DONE
commentRouter.delete("/:postId/:commentId", async (req, res, next) => {
  try {
    const comment = await CommentModel.findByIdAndDelete(req.params.commentId);
    const removeFromPost = await PostModel.findByIdAndUpdate(
      req.params.postId,
      {
        $pull: {
          comments: { _id: mongoose.Types.ObjectId(req.params.commentId) },
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    res.send(removeFromPost.comments);
  } catch (error) {
    next(error);
  }
});

module.exports = commentRouter;
