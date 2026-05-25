const express = require('express');
const { Conversation, Message } = require('../models/Message');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/conversations', async (req, res, next) => {
  try {
    const query = req.query.userId
      ? { $or: [{ participantOne: req.query.userId }, { participantTwo: req.query.userId }] }
      : {};

    if (req.query.userId) {
      if (req.query.archived === 'true') {
        query.archivedBy = req.query.userId;
      } else if (req.query.includeArchived !== 'true') {
        query.archivedBy = { $ne: req.query.userId };
      }
    }

    const conversations = await Conversation.find(query)
      .populate('participantOne participantTwo', '-password')
      .populate('jobId')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations', async (req, res, next) => {
  try {
    const { participantOne, participantTwo, jobId } = req.body;
    if (!participantOne || !participantTwo) {
      return res.status(400).json({ error: 'participantOne and participantTwo are required' });
    }

    const existingConversation = await Conversation.findOne({
      $or: [
        { participantOne, participantTwo },
        { participantOne: participantTwo, participantTwo: participantOne },
      ],
      ...(jobId ? { jobId } : {}),
    })
      .populate('participantOne participantTwo', '-password')
      .populate('jobId');

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const conversation = await Conversation.create({ participantOne, participantTwo, jobId });
    const fullConversation = await Conversation.findById(conversation._id)
      .populate('participantOne participantTwo', '-password')
      .populate('jobId');
    res.status(201).json(fullConversation);
  } catch (error) {
    next(error);
  }
});

router.get('/conversations/:conversationId', async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', '-password')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations/:conversationId', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const conversationCheck = await Conversation.findById(req.params.conversationId);
    if (!conversationCheck) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversationCheck.blockedBy) {
      return res.status(403).json({ error: 'Chat is blocked in this conversation' });
    }

    const message = await Message.create({
      ...req.body,
      conversationId: req.params.conversationId,
    });

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { lastMessageAt: new Date() },
      { new: true }
    ).populate('participantOne participantTwo', '-password');

    const fullMessage = await Message.findById(message._id).populate('senderId', '-password');

    if (conversation) {
      const senderId = req.body.senderId?.toString();
      const participantOneId = conversation.participantOne?._id?.toString();
      const participantTwoId = conversation.participantTwo?._id?.toString();
      const receiverId = senderId === participantOneId ? participantTwoId : participantOneId;

      if (receiverId) {
        await Notification.create({
          userId: receiverId,
          type: 'new_message',
          title: 'New Message',
          message: `${conversation.participantOne?._id?.toString() === senderId ? conversation.participantOne.fullName : conversation.participantTwo.fullName} sent you a message`,
          data: { conversationId: req.params.conversationId },
        });
      }
    }

    if (io && conversation) {
      io.to(`conversation:${req.params.conversationId}`).emit('message:new', fullMessage);
      io.to(`user:${conversation.participantOne._id}`).emit('conversation:updated', conversation);
      io.to(`user:${conversation.participantTwo._id}`).emit('conversation:updated', conversation);

      const senderId = req.body.senderId?.toString();
      const participantOneId = conversation.participantOne?._id?.toString();
      const participantTwoId = conversation.participantTwo?._id?.toString();
      const receiverId = senderId === participantOneId ? participantTwoId : participantOneId;
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('notification:new', {
          type: 'new_message',
          title: 'New Message',
          message: fullMessage.content,
          conversationId: req.params.conversationId,
        });
      }
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    next(error);
  }
});

router.patch('/conversations/:conversationId/block', async (req, res, next) => {
  try {
    const { userId, blocked } = req.body;
    const io = req.app.get('io');
    const conversation = await Conversation.findById(req.params.conversationId).populate('participantOne participantTwo', '-password');
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (blocked) {
      conversation.blockedBy = userId;
      conversation.blockedAt = new Date();
    } else if (conversation.blockedBy && conversation.blockedBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only the user who blocked can unblock' });
    } else if (conversation.blockedBy?.toString() === userId) {
      conversation.blockedBy = null;
      conversation.blockedAt = null;
    }

    await conversation.save();

    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('conversation:blocked', {
        conversationId: req.params.conversationId,
        blockedBy: conversation.blockedBy,
      });
      io.to(`user:${conversation.participantOne._id}`).emit('conversation:updated', conversation);
      io.to(`user:${conversation.participantTwo._id}`).emit('conversation:updated', conversation);
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

router.patch('/conversations/:conversationId/archive', async (req, res, next) => {
  try {
    const { userId, archived } = req.body;
    const io = req.app.get('io');
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participantOne participantTwo', '-password');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const participantOneId = conversation.participantOne?._id?.toString();
    const participantTwoId = conversation.participantTwo?._id?.toString();
    const isParticipant = userId && [participantOneId, participantTwoId].includes(userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not allowed to archive this conversation' });
    }

    if (!Array.isArray(conversation.archivedBy)) {
      conversation.archivedBy = [];
    }

    const alreadyArchived = conversation.archivedBy.some((id) => id.toString() === userId.toString());
    if (archived && !alreadyArchived) {
      conversation.archivedBy.push(userId);
    }
    if (!archived && alreadyArchived) {
      conversation.archivedBy = conversation.archivedBy.filter((id) => id.toString() !== userId.toString());
    }

    await conversation.save();

    if (io) {
      io.to(`user:${participantOneId}`).emit('conversation:updated', conversation);
      io.to(`user:${participantTwoId}`).emit('conversation:updated', conversation);
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

router.delete('/conversations/:conversationId', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const io = req.app.get('io');
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participantOne participantTwo', '-password');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const participantOneId = conversation.participantOne?._id?.toString();
    const participantTwoId = conversation.participantTwo?._id?.toString();
    const isParticipant = userId && [participantOneId, participantTwoId].includes(userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not allowed to delete this conversation' });
    }

    await Message.deleteMany({ conversationId: req.params.conversationId });
    await Conversation.findByIdAndDelete(req.params.conversationId);

    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('conversation:deleted', {
        conversationId: req.params.conversationId,
      });
      io.to(`user:${participantOneId}`).emit('conversation:deleted', {
        conversationId: req.params.conversationId,
      });
      io.to(`user:${participantTwoId}`).emit('conversation:deleted', {
        conversationId: req.params.conversationId,
      });
      io.to(`user:${participantOneId}`).emit('conversation:updated');
      io.to(`user:${participantTwoId}`).emit('conversation:updated');
    }

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
});

router.patch('/read/:conversationId', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const { conversationId } = req.params;
    const { userId } = req.body;
    const result = await Message.updateMany(
      { conversationId, senderId: { $ne: userId } },
      { isRead: true }
    );

    await Notification.updateMany(
      {
        userId,
        type: 'new_message',
        isRead: false,
        'data.conversationId': conversationId,
      },
      { isRead: true }
    );

    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:read', {
        conversationId,
        userId,
      });
      io.to(`user:${userId}`).emit('counts:refresh');
    }

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
