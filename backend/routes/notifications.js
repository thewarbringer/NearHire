const express = require('express')
const mongoose = require('mongoose')
const Notification = require('../models/Notification')
const verifyToken = require('../middleware/auth')

const router = express.Router()

// GET /api/notifications — fetch all notifications for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)

    return res.json({ notifications })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return res.status(500).json({ message: 'Server error fetching notifications' })
  }
})

// GET /api/notifications/unread-count — return unread count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.userId,
      read: false,
    })

    return res.json({ count })
  } catch (error) {
    console.error('Unread count error:', error)
    return res.status(500).json({ message: 'Server error fetching unread count' })
  }
})

// PUT /api/notifications/mark-read — mark all or specific notifications as read
router.put('/mark-read', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body

    const filter = { recipientId: req.userId, read: false }

    // If specific IDs provided, only mark those
    if (Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
      if (validIds.length > 0) {
        filter._id = { $in: validIds }
      }
    }

    await Notification.updateMany(filter, { $set: { read: true } })

    return res.json({ message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Mark read error:', error)
    return res.status(500).json({ message: 'Server error marking notifications' })
  }
})

module.exports = router
