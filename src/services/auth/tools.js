const jwt = require("jsonwebtoken");
const UserModel = require("../users/schema");

const authenticate = async (user) => {
  try {
    const accessToken = await generateAccessToken({ _id: user._id });
    const refreshToken = await generateRefreshToken({ _id: user._id });

    user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });

    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateAccessToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET || "642a7c4d7c59b6c0cdbb41bfe70b925eed339470cf5beff24efb698d6d1e08f4ddbcda34465d84e2f2b2038cf5dbe7a871966d7fd36e981869b5f64564dc553d",
      { expiresIn: "15m" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyAccessToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const generateRefreshToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET || "ab0519108994b3c8b631627aa2166f583ef069881e224273b32e1de7d076c0398caf6a98a017db953eea4ccf71ef58e8fb37b6c949b20eb8e482555fef9af8c7",
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );  

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refresh = async (oldRefreshToken) => {
  try {
    const decoded = await verifyRefreshToken(oldRefreshToken); //  decoded._id
    const user = await UserModel.findOne({ _id: decoded._id });
    const currentRefreshToken = user.refreshTokens.find(
      (token) => token.token === oldRefreshToken
    );

    if (!currentRefreshToken) {
      throw new Error("Bad refresh token provided!");
    }

    const newAccessToken = await generateAccessToken({ _id: user._id });
    const newRefreshToken = await generateRefreshToken({ _id: user._id });
    console.log(newAccessToken,"NEW ACCESS TOKEN")
    console.log(newRefreshToken,"NEW REFRESH TOKEN")
    const newRefreshTokensList = user.refreshTokens
      .filter((token) => token.token !== oldRefreshToken)
      .concat({ token: newRefreshToken });
    console.log(newRefreshTokensList,"LIST OF TOKENS")
    user.refreshTokens = [...newRefreshTokensList];

    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log(error);
  }
};

const removeToken = async (res) => {
  try {
    console.log(res.cookie("refreshToken"),"THE RESPONSE")
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
  } catch (error) {
    console.log(error)
  }
}
module.exports = { authenticate, verifyAccessToken, refresh, removeToken };
