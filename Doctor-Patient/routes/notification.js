import { Router } from "express";
import { body, validationResult } from "express-validator";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";

const notificationRouter = Router();

// Get notifications for a user
notificationRouter.get("/", authenticate, async (req, res) => {
  try {
    const { userType, user } = req;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipient: user._id,
      recipientType: userType,
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await notification.countDocuments(query);
    const unreadCount = await notification.countDocuments({
      recipient: user._id,
      recipientType: userType,
      isRead: false
    });

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
notificationRouter.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notificationDoc = await notification.findById(id);
    if (!notificationDoc) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check authorization
    if (notificationDoc.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to mark this notification as read' });
    }

    // Update notification
    notificationDoc.isRead = true;
    notificationDoc.readAt = new Date();
    await notificationDoc.save();

    res.json({
      message: 'Notification marked as read',
      notification: notificationDoc
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
notificationRouter.patch("/read-all", authenticate, async (req, res) => {
  try {
    const { userType, user } = req;

    await notification.updateMany(
      {
        recipient: user._id,
        recipientType: userType,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete notification
notificationRouter.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notificationDoc = await notification.findById(id);
    if (!notificationDoc) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check authorization
    if (notificationDoc.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await notification.findByIdAndDelete(id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create notification (admin only)
notificationRouter.post("/", [
  authenticate,
  authorize('admin'),
  body('recipient').isMongoId().withMessage('Valid recipient ID required'),
  body('recipientType').isIn(['patient', 'doctor', 'admin']).withMessage('Valid recipient type required'),
  body('title').notEmpty().withMessage('Title required'),
  body('message').notEmpty().withMessage('Message required'),
  body('type').isIn(['appointment', 'prescription', 'payment', 'system', 'reminder', 'emergency']).withMessage('Valid type required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, recipientType, title, message, type, priority = 'medium', actionUrl, metadata } = req.body;

    const newNotification = new notification({
      recipient,
      recipientType,
      title,
      message,
      type,
      priority,
      actionUrl,
      metadata,
    });

    await newNotification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notification statistics
notificationRouter.get("/stats", authenticate, async (req, res) => {
  try {
    const { userType, user } = req;

    const stats = await notification.aggregate([
      {
        $match: {
          recipient: user._id,
          recipientType: userType,
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalNotifications = await notification.countDocuments({
      recipient: user._id,
      recipientType: userType,
    });

    const unreadNotifications = await notification.countDocuments({
      recipient: user._id,
      recipientType: userType,
      isRead: false,
    });

    res.json({
      stats,
      totalNotifications,
      unreadNotifications,
      readNotifications: totalNotifications - unreadNotifications
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default notificationRouter;


