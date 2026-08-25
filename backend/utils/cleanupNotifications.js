const Notification = require('../models/Notification')

/**
 * Periodically cleans up old read notifications from MongoDB
 * Deletes notifications marked read that were updated > 7 days ago.
 */
const cleanOldNotifications = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const result = await Notification.deleteMany({
      read: true,
      updatedAt: { $lt: sevenDaysAgo },
    })

    if (result.deletedCount > 0) {
      console.log(`[Notification Cleanup] Purged ${result.deletedCount} old read notification(s).`)
    }
  } catch (error) {
    console.error('[Notification Cleanup Error]:', error.message)
  }
}

module.exports = cleanOldNotifications
