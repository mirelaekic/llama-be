const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    googleId:String,
    imgUrl: String,
    age: Number,
    city: String,
    following: [
      {user:{
        type:Schema.ObjectId,
        ref:"user"
      }}
    ],
    followers: [
      {user:{
        type:Schema.ObjectId,
        ref:"user"
      }}
    ],
    refreshTokens: [
        {
          token: {
            type: String,
          },
        },
      ],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  const user = this;
  const plainPW = user.password;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(plainPW, 10);
  }
  next();
});

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const matches = await bcrypt.compare(password, user.password);
    if (matches) return user;
    else return null;
  } else {
    return null;
  }
};

const userModel = model("user", UserSchema);
module.exports = userModel;
