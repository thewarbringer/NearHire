// Centralized Socket.IO instance holder
// Routes can import this to emit events without circular dependencies

let io = null

function setIO(ioInstance) {
  io = ioInstance
}

function getIO() {
  return io
}

// Map of userId -> Set of socketIds (a user can have multiple tabs)
const connectedUsers = new Map()

function addUser(userId, socketId) {
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set())
  }
  connectedUsers.get(userId).add(socketId)
}

function removeUser(userId, socketId) {
  if (connectedUsers.has(userId)) {
    connectedUsers.get(userId).delete(socketId)
    if (connectedUsers.get(userId).size === 0) {
      connectedUsers.delete(userId)
    }
  }
}

function emitToUser(userId, event, data) {
  const ioInstance = getIO()
  if (!ioInstance) return

  const sockets = connectedUsers.get(userId)
  if (sockets && sockets.size > 0) {
    for (const socketId of sockets) {
      ioInstance.to(socketId).emit(event, data)
    }
  }
}

module.exports = { setIO, getIO, addUser, removeUser, emitToUser }
