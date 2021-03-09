const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const PostModel = require("./schema");
const UserModel = require("../users/schema");
const mongoose = require("mongoose")
const postRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "llama",
  },
});

const cloudinaryMulter = multer({ storage: storage });
//  get all posts
postRouter.get("/", async (req, res, next) => {
  try {
    const posts = await PostModel.find();
    res.send(posts);
  } catch (error) {
    next(error);
  }
});
//  create a route to post only a post with text /me
postRouter.post("/me",async (req, res, next) => {
    try {
        const newPost = new PostModel({...req.body,userId:req.user.id})
        const upload = await UserModel.findByIdAndUpdate(req.user.id,{
            $push:{posts:newPost}
        },
        { runValidators: true, new: true })
        const{_id} = await newPost.save()
        res.status(201).send(upload.posts)
    } catch (error) {
        next(error)
    }
})
//  router to post a post with an image /me/img
postRouter.post(
  "/me/img",
  cloudinaryMulter.single("postImage"),
  async (req, res, next) => {
    try {
      const uid = req.user;
      const post = new PostModel({
        ...req.body,
        postImg: req.file.path,
        userId: uid._id,
      });
      const postToInsert = { ...post.toObject() };
      const addedPost = await UserModel.findByIdAndUpdate(
        uid._id,
        {
          $push: { posts: postToInsert },
        },
        { runValidators: true, new: true }
      );
      const { _id } = await post.save();
      res.status(201).send(addedPost.posts);
    } catch (error) {
      next(error);
    }
  }
);

postRouter.get("/me", async (req, res, next) => {
  try {
    const user = req.user._id;
    const findMyPosts = await PostModel.find({ userId: user });
    res.send(findMyPosts);
  } catch (error) {
    next(error);
  }
});

postRouter.get("/:id", async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.id);
    res.send(post);
  } catch (error) {
    next(error);
  }
});

postRouter.put("/me/:id",async (req,res,next) => {
    try {
    const post = await PostModel.findOneAndUpdate({_id:req.params.id},{...req.body},{findOneAndUpdate:true})
    // push updated post to user posts array
    const {posts} = await UserModel.findOne({_id: mongoose.Types.ObjectId(req.user._id)},{
        posts: {
            $elemMatch: {_id:mongoose.Types.ObjectId(req.params.id)}
        }
    })
    const oldPost = posts[0]
    const modifiedPost = {...oldPost,...req.body}
    await UserModel.findOneAndUpdate({
        _id:mongoose.Types.ObjectId(req.user._id),
        "posts._id": mongoose.Types.ObjectId(req.params.id)
    },{
        $set: {"posts.$":modifiedPost}
    },{findOneAndUpdate:true})
    const saved = await post.save()
    res.send(saved)
    } catch (error) {
        next(error)
    }
})

postRouter.delete("/me/:postId", async (req, res, next) => {
    try {
        const post = await PostModel.findByIdAndDelete(req.params.postId)
         const removeFromUser = await UserModel.findByIdAndUpdate(req.user.id,{
             $pull:{posts:{_id: mongoose.Types.ObjectId(req.params.postId)}}
         },
         {
           runValidators: true,
           new: true,
         })
        res.send(removeFromUser.posts)
    } catch (error) {
        next(error)
    }
});

module.exports = postRouter;
