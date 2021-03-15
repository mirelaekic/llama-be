const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../users/schema");
const { authenticate } = require("./tools");


passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:9010/users/googleRedirect",
    },
    async (request, accessToken, refreshToken, profile, next) => {
        console.log(accessToken,"TOKEN")
      const newUser = {
        googleId: profile.id,
        name: profile.name.givenName,
        surname: profile.name.familyName,
        email: profile.emails[0].value,
        role: "User",
        refreshTokens: [],
      };

      try {
        const user = await UserModel.findOne({ googleId: profile.id });
        console.log(user,"FINDING USER")
        if (user) {
          const tokens = await authenticate(user);
          console.log(tokens,"TOKENS USER GETS AFTER WE FInd him in db")
          next(null, { user, tokens });
        } else {
          const createdUser = new UserModel(newUser);
          await createdUser.save();
          const tokens = await authenticate(createdUser);
          next(null, { user: createdUser, tokens });
        }
      } catch (error) {
        next(error);
      }
    }
  )
);

passport.serializeUser(function (user, next) {
  next(null, user);
});
