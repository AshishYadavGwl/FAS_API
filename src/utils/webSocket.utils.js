// utils/webSocket.utils.js

class WebSocketUtils {
  static validateConnection(socket) {
    return socket && socket.connected;
  }

  static createRoomName(meetingId) {
    return `meeting-${meetingId}`;
  }

  static formatFlightUpdate(user, alertId, newStatus, newState) {
    return {
      userId: user.id,
      meetingId: user.meetingId || null,
      alertId,
      flight: user.flightNumber,
      name: `${user.firstName} ${user.lastName}`,
      carrier: user.carrierCode,
      route: `${user.originAirport} → ${user.destinationAirport}`,
      oldStatus: user.status,
      newStatus,
      oldState: user.state,
      newState,
      timestamp: Date.now(),
    };
  }

  static formatBulkUpdate(updates) {
    return {
      count: updates.length,
      updates: updates.map((u) => ({
        userId: u.userId,
        flight: u.flight,
        status: u.status,
        state: u.state,
      })),
      timestamp: Date.now(),
    };
  }

  static logBroadcast(type, recipient, data) {
    console.log(
      `📡 WS ${type} → ${recipient} | Flight: ${data.flight} | State: ${data.newState}`
    );
  }
}

export default WebSocketUtils;
