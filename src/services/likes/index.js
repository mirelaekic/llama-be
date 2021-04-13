const express = require("express");
const LikeModel = require("./schema");
const likeRouter = express.Router();
const userModel = require("../users/schema");
const { authorize } = require("../auth/middleware");
//GET FAVORITE ARRAY
likeRouter.get("/favorite",(req,res,next) => {
  try {   
    const fav = req.user
    res.send(fav.favourites)
  } catch (error) {
    next(error)
  }
})  
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

// ADD PLACE TO FAV
likeRouter.post("/favourite/:cityId/", (req, res, next) => {
  userModel.findById(req.user.id)
  .then(user => {
    const findFav = user.favourites.find((fav) => fav.placeId === req.params.cityId)
    if(findFav){
      return res.status(404).json({alreadyInFavourites:"This place is already in favourites"})
    } 
    const newFav = user.favourites.push({placeId:req.params.cityId,photoRef:req.body.photoUrl,placeName:req.body.placeName})
    user.save().then(user => res.json(newFav[0]))
  })
  .catch(err => res.status(404).json({error:err}))
})
// REMOVE PlACE FROM FAV
likeRouter.post("/removeFav/:cityId", (req, res, next) => {
  userModel.findById(req.user.id)
  .then(user => {
    const filterArr = user.favourites.filter(fav => fav.placeId === req.params.cityId)
    const index = user.favourites.map((fav) => {
      return fav.placeId
    }).indexOf(req.params.cityId)
    if(index >= 0 ){
      console.log(index,"the index")
    const removedFav = user.favourites.splice(index,1)
      user.save().then(user => res.json(removedFav[0]))
    } else {
      res.status(404).json("not in the fav array")
    }
  })
  .catch(err => res.status(404).json({error:err}))
})

module.exports = likeRouter;
