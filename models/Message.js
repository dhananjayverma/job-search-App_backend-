const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participantOne: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participantTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    blockedAt: { type: Date, default: null },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: String,
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'resume', 'voice'],
      default: 'text',
    },
    fileUrl: String,
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    reactions: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema),
};
