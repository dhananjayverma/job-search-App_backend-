const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.unread === 'true') query.isRead = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all/:userId', async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
