// services/webSocket.service.js

import WebSocketUtils from "../utils/webSocket.utils.js";

class WebSocketService {
  constructor() {
    this.io = null;
    this.isInitialized = false;
    this.connectedClients = new Map();
    this.roomSubscriptions = new Map();

    this.stats = {
      connections: 0,
      disconnections: 0,
      broadcasts: 0,
      roomBroadcasts: 0,
      errors: 0,
    };
  }

  // Initialize Socket.IO
  init(io) {
    if (this.isInitialized)
      return console.log("⚠️  WebSocket already initialized");

    this.io = io;
    this.setupEventHandlers();
    this.isInitialized = true;

    console.log("✅ WebSocket service initialized");
  }

  // Setup all WebSocket event handlers
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);

      socket.on("joinMeeting", (meetingId) =>
        this.handleJoinMeeting(socket, meetingId)
      );
      socket.on("leaveMeeting", (meetingId) =>
        this.handleLeaveMeeting(socket, meetingId)
      );
      socket.on("disconnect", () => this.handleDisconnect(socket));
      socket.on("error", (err) => this.handleError(socket, err));
    });
  }

  // Handle new connection
  handleConnection(socket) {
    this.stats.connections++;
    this.connectedClients.set(socket.id, {
      socketId: socket.id,
      connectedAt: Date.now(),
      rooms: new Set(),
    });

    console.log(
      `✅ Client connected: ${socket.id} | Total: ${this.connectedClients.size}`
    );

    socket.emit("connected", {
      socketId: socket.id,
      timestamp: Date.now(),
    });
  }

  // Handle join meeting room
  handleJoinMeeting(socket, meetingId) {
    if (!meetingId) return;

    const roomName = WebSocketUtils.createRoomName(meetingId);
    socket.join(roomName);

    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.rooms.add(roomName);
    }

    if (!this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.set(roomName, new Set());
    }
    this.roomSubscriptions.get(roomName).add(socket.id);

    console.log(
      `👤 ${socket.id} joined ${roomName} | Room size: ${
        this.roomSubscriptions.get(roomName).size
      }`
    );

    socket.emit("joinedMeeting", {
      meetingId,
      roomName,
      timestamp: Date.now(),
    });
  }

  // Handle leave meeting room
  handleLeaveMeeting(socket, meetingId) {
    if (!meetingId) return;

    const roomName = WebSocketUtils.createRoomName(meetingId);
    socket.leave(roomName);

    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.rooms.delete(roomName);
    }

    if (this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.get(roomName).delete(socket.id);

      if (this.roomSubscriptions.get(roomName).size === 0) {
        this.roomSubscriptions.delete(roomName);
      }
    }

    console.log(`👋 ${socket.id} left ${roomName}`);
  }

  // Handle disconnect
  handleDisconnect(socket) {
    this.stats.disconnections++;

    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.rooms.forEach((roomName) => {
        if (this.roomSubscriptions.has(roomName)) {
          this.roomSubscriptions.get(roomName).delete(socket.id);
        }
      });
    }

    this.connectedClients.delete(socket.id);
    console.log(
      `❌ Client disconnected: ${socket.id} | Total: ${this.connectedClients.size}`
    );
  }

  // Handle errors
  handleError(socket, error) {
    this.stats.errors++;
    console.error(`❌ WebSocket error [${socket.id}]:`, error.message);
  }

  // Broadcast flight update to all clients
  broadcastFlightUpdate(user, alertId, newStatus, newState) {
    if (!this.isInitialized || !this.io) return;

    try {
      const data = WebSocketUtils.formatFlightUpdate(
        user,
        alertId,
        newStatus,
        newState
      );

      // Global broadcast
      this.io.emit("flightUpdate", data);
      this.stats.broadcasts++;

      WebSocketUtils.logBroadcast("Global", "All", data);

      // Room-specific broadcast
      if (user.meetingId) {
        this.broadcastToRoom(user.meetingId, "flightUpdate", data);
      }
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Broadcast error:", error.message);
    }
  }

  // Broadcast to specific meeting room
  broadcastToRoom(meetingId, event, data) {
    if (!this.isInitialized || !meetingId) return;

    const roomName = WebSocketUtils.createRoomName(meetingId);
    const roomSize = this.roomSubscriptions.get(roomName)?.size || 0;

    if (roomSize > 0) {
      this.io.to(roomName).emit(event, data);
      this.stats.roomBroadcasts++;

      WebSocketUtils.logBroadcast("Room", roomName, data);
    }
  }

  // Broadcast bulk updates
  broadcastBulkUpdate(updates) {
    if (!this.isInitialized || !updates.length) return;

    const data = WebSocketUtils.formatBulkUpdate(updates);
    this.io.emit("bulkFlightUpdate", data);
    this.stats.broadcasts++;

    console.log(`📡 Bulk broadcast: ${updates.length} updates`);
  }

  // Get service stats
  getStats() {
    return {
      initialized: this.isInitialized,
      connectedClients: this.connectedClients.size,
      activeRooms: this.roomSubscriptions.size,
      stats: this.stats,
      rooms: Array.from(this.roomSubscriptions.entries()).map(
        ([room, clients]) => ({
          room,
          clients: clients.size,
        })
      ),
    };
  }

  // Cleanup
  shutdown() {
    if (!this.isInitialized) return;

    this.io.close();
    this.connectedClients.clear();
    this.roomSubscriptions.clear();
    this.isInitialized = false;

    console.log("✅ WebSocket service shutdown");
  }
}

export default new WebSocketService();
