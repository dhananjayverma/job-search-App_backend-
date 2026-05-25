const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'new_message',
        'application_update',
        'profile_view',
        'interview_scheduled',
        'job_match',
        'job_alert',
        'post_like',
        'post_comment',
        'new_follower',
      ],
      default: 'job_alert',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
