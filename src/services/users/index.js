const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const { authenticate, refresh } = require("../auth/tools");
const { authorize } = require("../auth/middleware");
const UserModel = require("./schema");


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

userRouter.put("/me/profilePic", authorize,cloudinaryMulter.single("image"), async (req, res, next) => {
    try {
    const user = req.user._id
    console.log(user)
    console.log(req.file.path,"imagepath")
    await UserModel.findByIdAndUpdate({_id: user},{imgUrl: req.file.path},{useFindAndModify:true,new:true,upsert:true})
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
    }
  });

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
