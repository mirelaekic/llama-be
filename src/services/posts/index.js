const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const PostModel = require("./schema");
const UserModel = require("../users/schema");
const mongoose = require("mongoose");
const postRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "llama",
  },
});

const cloudinaryMulter = multer({ storage: storage });
postRouter.get("/", async (req, res, next) => {
  try {
    const posts = await PostModel.find();
    res.send(posts);
  } catch (error) {
    next(error);
  }
});

postRouter.get("/me", async (req, res, next) => {
  try {
    const user = req.user._id;
    const findMyPosts = await PostModel.find({ userId: user });
    res.send(findMyPosts);
  } catch (error) {
    next(error);
  }
});

postRouter.post(
  "/me",
  cloudinaryMulter.single("image"),
  async (req, res, next) => {
    try {
      const uid = req.user;
      const post = new PostModel({
        ...req.body,
        postImg: req.file ? req.file.path : "",
        userId: uid._id,
      });
      console.log(post,"THE NEW POST")
      const { _id } = await post.save();
      res.status(201).send(_id);
    } catch (error) {
      console.log(error,"the")
      next(error);
    }
  }
);

postRouter.get("/:id", async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.id);
    res.send(post);
  } catch (error) {
    next(error);
  }
});

postRouter.put(
  "/me/:id",
  cloudinaryMulter.single("postImage"),
  async (req, res, next) => {
    try {
      const post = await PostModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { ...req.body, postImg: req.file ? req.file.path : "" },
        { findOneAndUpdate: true }
      );
      const saved = await post.save();
      res.send(saved);
    } catch (error) {
      next(error);
    }
  }
);

postRouter.delete("/me/:postId", async (req, res, next) => {
  try {
    await PostModel.findOneAndDelete({
      _id: req.params.postId,
      userId: req.user._id,
    });
    res.send("Post deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = postRouter;
