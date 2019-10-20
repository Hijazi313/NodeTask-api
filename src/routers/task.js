const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");

const Task = require("../models/task");

router.get("/tasks", auth, async (req, res, next) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    // const task = await Task.find({ owner: req.user_id });
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();

    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.post("/tasks", auth, async (req, res, next) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.get("/tasks/:id", auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send("No Task Found");
    } else {
      res.send(task);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res, next) => {
  const _id = req.params.id;

  const updates = Object.keys(req.body);
  const allowedTasks = ["description", "completed"];
  const isValid = updates.every(task => allowedTasks.includes(task));
  if (!isValid) {
    return res.status(400).send("Error: Invalid Option");
  }
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send("No Task Found");
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.delete("/tasks/:id", auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).json({ error: "No Task Found" });
    }
    res.json({ message: "success", task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
