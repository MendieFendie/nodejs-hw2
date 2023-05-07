const Jimp = require("jimp");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const User = require("../service/schemas/authSchema");
const { updateAvatar } = require("../service/usersService");
const { v4: uuidv4 } = require("uuid");

async function avatarController(req, res, next) {
  const [tokenType, token] = req.headers.authorization.split(" ");
  try {
    const userId = jwt.decode(token, process.env.JWT_SECRET);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const image = await Jimp.read(req.file.path);
    image.cover(250, 250).quality(60);

    const newFileName = `${uuidv4()}.jpg`;
    const newFilePath = path.join(
      __dirname,
      "..",
      "public",
      "avatars",
      newFileName
    );
    await image.writeAsync(newFilePath);

    const oldAvatarPath = user.avatarURL
      ? path.join(__dirname, "..", "public", user.avatarURL)
      : null;

    if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }

    const avatarURL = `/avatars/${newFileName}`;

    await updateAvatar(userId, avatarURL);

    return res.json({ avatarURL });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = avatarController;
