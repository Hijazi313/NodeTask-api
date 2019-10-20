const express = require("express");
const router = new express.Router();
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middleware/auth");
const { sendWelcomeMessage } = require("../emails/account");
const User = require("../models/user");

router.get("/users/me", auth, async (req, res, next) => {
  res.send(req.user);
});

// Sign Up
router.post("/users", async (req, res, next) => {
  const user = new User(req.body);

  try {
    await user.save();
    // sendWelcomeMessage(user.name, user.email);
    const token = await user.generateAuthToken();

    res.status(201).send({
      user,
      token
    });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

//Login
router.post("/users/login", async (req, res, next) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});

const upload = multer({
  // dest: "avatars",
  limits: 100000,
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("File Must be JPEG , PNG or JPG format"));
    }
    cb(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 350, height: 350 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.post("/users/logout", auth, async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send("Logged Out");
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res, next) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send("logged out of all devices");
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/users/me", auth, async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send("Error: Invalid Operation");
  }

  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.json(req.user);
  } catch (e) {
    console.log(e.message);
  }
});

router.delete("/users/me", auth, async (req, res, next) => {
  try {
    await req.user.remove();
    res.json(req.user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.delete("/users/me/avatar", auth, async (req, res, next) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send("Deleted");
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/:id/avatar", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send("No Image Found");
  }
});

module.exports = router;
