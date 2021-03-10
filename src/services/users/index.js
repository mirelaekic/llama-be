const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const { authenticate, refresh } = require("../auth/tools");
const { authorize } = require("../auth/middleware");
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
  cloudinaryMulter.single("image"),
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
    //Check credentials
    const { email, password } = req.body;

    const user = await UserModel.findByCredentials(email, password);
    //Generate token
    const { accessToken, refreshToken } = await authenticate(user);

    //Send back tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/users/refreshToken",
    });

    res.send("Ok");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// userRouter.post("/logout", authorize, async (req, res, next) => {
//   try {
//     req.user.refreshTokens = req.user.refreshTokens.filter(
//       (t) => t.token !== req.body.refreshToken
//     );
//     await req.user.save();
//     res.send();
//   } catch (err) {
//     next(err);
//   }
// });
// userRouter.get('/logout', function (req, res) {
//     req.logOut();
//     res.status(200).clearCookie('connect.sid', {
//       path: '/'
//     });
//     req.session.destroy(function (err) {
//       res.redirect('/');
//     });
//   });

//ADD TO FOLLOWING ARRAY
//then after adding the user to follow, go to the user Profile and create a new Follower
userRouter.post("/follow/:user_id", authorize, (req, res) => {
  if (req.user.id === req.params.user_id) {
    return res.status(400).json({ alreadyfollow : "You cannot follow yourself"})
} 
UserModel.findById(req.params.user_id)
    .then(user => {
        console.log(user,"USER ")
        //filtering followers from the user that is receiving the req to be followed, 
        //checking if it matches with the user sending req. if it matches,that means that 
        // the user sending req. already exists in array of followers of the user wed like to follow 
        // and that means we cant follow again
        // we have to create a function to remove the user from the followers array

        //checking if the user sending the req. is already in the followers array of the user we want to follow
        const filteredUser = user.followers.filter(follower => follower.user.toString() === req.user.id)
        console.log(filteredUser,"req.user")
        if(filteredUser.length > 0){  // if the length is greater than 0, that means that the req.user is twice in the array 
                                      // it should not be allowed to follow same user twice!  
            return res.status(400).json({ alreadyfollow : "You already followed the user"})
        }
        // if the user is not followed, we add the follower  
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
userRouter.post("/unfollow/:user_id", authorize, (req, res) => {
  if (req.user.id === req.params.user_id) {
    return res.status(400).json({ alreadyfollow : "You cannot ufollow yourself"})
} 
UserModel.findById(req.params.user_id)
    .then(user => {
        console.log(user,"USER ")
        const filteredUser = user.followers.filter(follower => follower.user.toString() === req.user.id)
        console.log(filteredUser[0], "Followers")
        if(filteredUser.length > 1){  
        const removeFollower = filteredUser.shift()
        return res.status(400).json(removeFollower)
        }
        // if the user is not followed, we remove the follower 

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

userRouter.get("/refreshToken", async (req, res, next) => {
  try {
    // Grab the refresh token

    console.log(req.cookies);
    const oldRefreshToken = req.cookies.refreshToken;

    // Verify the token

    // If it's ok generate new access token and new refresh token

    const { accessToken, refreshToken } = await refresh(oldRefreshToken);

    // send them back

    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

module.exports = userRouter;
