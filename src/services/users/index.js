const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const { authenticate, refresh, removeToken } = require("../auth/tools");
const { authorize } = require("../auth/middleware");
const passport = require("passport")
const UserModel = require("./schema");
const mongoose = require("mongoose");
const userRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "llama",
  },
});

const cloudinaryMulter = multer({ storage: storage });

userRouter.get("/", authorize, async (req, res, next) => {
  try {
    const users = await UserModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

userRouter.post("/register", async (req, res, next) => {
  try {
    const emailTemplate = `
    <h4><strong>Thank you for registering ${req.body.name} <strong/></h4><br/>
    <p>Please confirm your email address by logging in here: </p><br/>
    <p> Enjoy on our llama app where you can share memories, ideas and more! </p>`;
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "welcometollama@gmail.com",
        pass: "Mirelaekic123",
      },
    });
    let mailOptions = {
      from: '"Llama 🦙" <welcometollama@gmail.com>',
      to: req.body.email,
      subject: `Welcome to Llama App ${req.body.name} 🥰`,
      text: "Hello world?",
      html: emailTemplate,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error.message);
      }
      console.log("email sent");
    });
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

userRouter.get("/me", authorize, async (req, res, next) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    next(error);
  }
});

userRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    res.send(user);
  } catch (error) {
    next(error);
  }
});

userRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

userRouter.put(
  "/me/profilePic",
  authorize,
  cloudinaryMulter.single("avatar"),
  async (req, res, next) => {
    try {
      const user = req.user._id;
      console.log(user);
      console.log(req.file.path, "imagepath");
      await UserModel.findByIdAndUpdate(
        { _id: user },
        { imgUrl: req.file.path },
        { useFindAndModify: true, new: true, upsert: true }
      );
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne(res.send("Deleted"));
  } catch (error) {
    next(error);
  }
});

userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByCredentials(email, password);
    const { accessToken, refreshToken } = await authenticate(user);
    console.log(refreshToken,"refresh token")
    res.cookie("accessToken", accessToken, {
      httpOnly: true, //secure:false,// sameSite:'none'
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
     httpOnly: true,// secure:false, //sameSite:'none',
      path: "/",
    });
    res.send({accessToken,refreshToken})
  } catch (error) {
    console.log(error);
    next(error);
  }
});

 userRouter.post("/logout", authorize, async (req, res, next) => {
   try {
     const clear = await removeToken(res)
     console.log(clear,"CLEAR")
     res.redirect("http://localhost:3000/login")
   } catch (err) {
     next(err);
   }
 });

//FOLLOW USER
userRouter.post("/follow/:user_id", authorize, (req, res) => {
  if (req.user.id === req.params.user_id) {
    return res.status(400).json({ alreadyfollow : "You cannot follow yourself"})
} 
UserModel.findById(req.params.user_id)
    .then(user => {
        console.log(user,"USER ")
        const filteredUser = user.followers.filter(follower => follower.user.toString() === req.user.id)
        console.log(filteredUser,"req.user")
        if(filteredUser.length > 0){   
            return res.status(400).json({ alreadyfollow : "You already followed the user"})
        } 
        user.followers.unshift({user:req.user.id});
        user.save()
        UserModel.findOne({ email: req.user.email })
            .then(user => {
                console.log(user,"when adding new user this is the action")
                user.following.unshift({user:req.params.user_id});
                user.save().then(user => res.json(user))
            })
            .catch(err => res.status(404).json({alradyfollow:"you already followed the user"}))
    })
});
//UNFOLLOW USER
userRouter.post("/unfollow/:user_id", authorize, (req, res) => {
  if (req.user.id === req.params.user_id) {
    return res.status(400).json({ alreadyfollow : "You cannot ufollow yourself"})
} 
UserModel.findById(req.params.user_id)
    .then(user => {
        const filteredUser = user.followers.filter(follower => follower.user.toString() === req.user.id)
        if(filteredUser.length > 1){  
        const removeFollower = filteredUser.shift()
        return res.status(400).json(removeFollower)
        }
       user.followers.shift({user:req.user.id});
       user.save()
        UserModel.findOne({ email: req.user.email })
            .then(user => {
                console.log(user,"when adding new user this is the action")
                user.following.shift({user:req.params.user_id});
                user.save().then(user => res.json(user))
            })
            .catch(err => res.status(404).json({alradyfollow:"you already unfollowed the user"}))
    })
});

userRouter.post("/refreshToken", async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    if(oldRefreshToken) {
      console.log(oldRefreshToken,"OLD TOKEN")
      const { accessToken, refreshToken } = await refresh(oldRefreshToken);
      res.cookie("accessToken", accessToken, {
        httpOnly: true, //secure:false, // sameSite:'none'
        path: "/",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //secure:false,// sameSite:'none',
        path: "/",
      });
      res.send({refreshToken, accessToken})
    } else {
      res.send("please log in again")
    }
    
  } catch (error) {
    next(error);
  }
});

userRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] },console.log("GOOGLE LOGIN"))
)

userRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        httpOnly: true,
      })
      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        httpOnly: true,
        path: "/",
      })

      res.status(200).redirect("http://localhost:3000/")
    } catch (error) {
      next(error)
    }
  }
)

module.exports = userRouter;
