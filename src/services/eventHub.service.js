import { Op } from "sequelize";
import MeetingUser from "../models/MeetingUser.js";
import { sequelize } from "../config/database.js";
import NodeCache from "node-cache";
import EventHubUtils from "../utils/eventHub.utils.js";
import EmailService from "./email.service.js";
import WebSocketService from "./webSocket.service.js";

class EventHubService {
  constructor() {
    // Step 1: Initialize service variables
    this.client = null; // Event Hub connection
    this.subscription = null; // Active listener
    this.isRunning = false; // Service status flag

    // Step 2: Setup cache for fast data access (stores alert->users mapping)
    this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

    // Step 3: Setup event processing queue
    this.queue = []; // Holds incoming events before batch processing
    this.batchSize = 100; // Process 100 events at once
    this.batchTimeout = 3000; // Wait 3 seconds before processing small batches
    this.timer = null; // Timer for batch timeout

    // Step 4: Setup deduplication (prevents processing same event twice)
    this.processed = new Set(); // Stores processed message IDs
    this.maxProcessed = 10000; // Keep last 10k IDs in memory

    // Step 5: Initialize statistics tracking
    this.stats = {
      start: Date.now(),
      received: 0, // Total events received
      processed: 0, // Events actually processed
      updated: 0, // Database records updated
      errors: 0, // Errors encountered
    };
  }

  // STEP 1: Start the service
  async start() {
    // Step 1a: Check if already running
    if (this.isRunning) return console.log("⚠️  Already running");

    console.log("🚀 Starting Event Hub service...");

    // Step 1b: Load all users with alerts into memory
    await this.loadCache();

    // Step 1c: Create connection to Event Hub
    this.client = EventHubUtils.createClient();
    this.isRunning = true;

    // Step 1d: Start listening for new events
    this.subscription = this.client.subscribe({
      // This function runs whenever new events arrive
      processEvents: async (events) => {
        if (!events.length) return; // Skip if empty

        // Update stats
        this.stats.received += events.length;

        // Add events to processing queue
        this.queue.push(...events);

        // Process immediately if queue is full, otherwise wait for timeout
        if (this.queue.length >= this.batchSize) {
          this.processBatch();
        } else if (!this.timer) {
          this.timer = setTimeout(() => this.processBatch(), this.batchTimeout);
        }
      },

      // This function runs if there's an error
      processError: (err) => {
        this.stats.errors++;
        console.error("❌", err.message);
      },
    });

    console.log("✅ Service active");

    // Step 1e: Start logging stats every 30 seconds
    this.statsInterval = setInterval(() => this.logStats(), 30000);
  }

  // STEP 2: Load users into cache
  async loadCache() {
    // Step 2a: Fetch all active users with alert IDs from database
    const users = await MeetingUser.findAll({
      where: {
        AlertId: { [Op.ne]: null }, // Has alert ID
        IsDeleted: false, // Not deleted
        IsActive: true, // Active
      },
      attributes: [
        "Id",
        "AlertId",
        "Status",
        "State",
        "LastSequenceNumber",
        "LastEventOffset",
        "FirstName",
        "LastName",
        "EmailId",
        "CarrierCode",
        "DepartureFlightNumber",
        "OriginAirport",
        "DestinationAirport",
        "DepartureDateTime",
      ],
      raw: true,
    });

    // Step 2b: Group users by alert ID
    const map = {};
    for (const u of users) {
      if (!map[u.AlertId]) map[u.AlertId] = [];
      map[u.AlertId].push({
        id: u.Id,
        firstName: u.FirstName,
        lastName: u.LastName,
        status: u.Status,
        state: u.State,
        lastSequenceNumber: u.LastSequenceNumber || 0,
        lastEventOffset: u.LastEventOffset,
        emailId: u.EmailId,
        carrierCode: u.CarrierCode,
        flightNumber: u.DepartureFlightNumber,
        originAirport: u.OriginAirport,
        destinationAirport: u.DestinationAirport,
        departureDateTime: u.DepartureDateTime,
      });
    }

    // Step 2c: Store in cache for fast access
    for (const [alertId, users] of Object.entries(map)) {
      this.cache.set(alertId, users);
    }

    console.log(
      `📦 Loaded ${Object.keys(map).length} alerts, ${users.length} users`
    );
  }

  // STEP 3: Process events in batch
  async processBatch() {
    if (!this.queue.length) return; // Skip if queue is empty

    // Step 3a: Clear timeout and get events to process
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const events = this.queue.splice(0, this.batchSize); // Take first 100 events
    const updates = new Map(); // Will store alert_id -> {status, state}

    // Step 3b: Process each event
    for (const event of events) {
      try {
        // Parse raw event data into clean format
        const parsed = EventHubUtils.parseEvent(event);

        // Skip if we already processed this message
        if (this.processed.has(parsed.messageId)) continue;

        // Mark as processed
        this.processed.add(parsed.messageId);

        // Keep only last 10k processed IDs (memory management)
        if (this.processed.size > this.maxProcessed) {
          const first = this.processed.values().next().value;
          this.processed.delete(first);
        }

        // Skip if no alert ID or no status info
        if (!parsed.alertId || parsed.status === "No Take Off Info") continue;

        // Update stats
        this.stats.processed++;

        // Format status with time
        const statusWithTime = EventHubUtils.formatStatusWithTime(
          parsed.status,
          parsed.time
        );

        // Log event received
        console.log(
          `📥 Alert: ${parsed.alertId} | Status: ${parsed.status} | State: ${parsed.state}`
        );

        // Store update for this alert
        updates.set(parsed.alertId, {
          status: statusWithTime,
          state: parsed.state,
          time: parsed.time,
          sequenceNumber: parsed.sequenceNumber,
          offset: parsed.offset,
        });
      } catch (err) {
        this.stats.errors++;
      }
    }

    // Step 3c: Apply updates to database if any
    if (updates.size) await this.applyUpdates(updates);
  }

  // STEP 4: Apply updates to cache and database
  async applyUpdates(updates) {
    const changes = []; // Will store actual changes to save

    // Step 4a: Check each alert for changes
    for (const [
      alertId,
      { status, state, time, sequenceNumber, offset },
    ] of updates) {
      // Try to get users from cache
      let users = this.cache.get(alertId);

      // Step 4b: If not in cache, fetch from database
      if (!users) {
        const dbUsers = await MeetingUser.findAll({
          where: { AlertId: alertId, IsDeleted: false, IsActive: true },
          attributes: [
            "Id",
            "Status",
            "State",
            "LastSequenceNumber",
            "LastEventOffset",
            "FirstName",
            "LastName",
            "EmailId",
            "CarrierCode",
            "DepartureFlightNumber",
            "OriginAirport",
            "DestinationAirport",
            "DepartureDateTime",
            "MeetingID",
          ],
          raw: true,
        });

        users = dbUsers.map((u) => ({
          id: u.Id,
          firstName: u.FirstName,
          lastName: u.LastName,
          status: u.Status,
          state: u.State,
          lastSequenceNumber: u.LastSequenceNumber || 0,
          lastEventOffset: u.LastEventOffset,
          emailId: u.EmailId,
          carrierCode: u.CarrierCode,
          flightNumber: u.DepartureFlightNumber,
          originAirport: u.OriginAirport,
          destinationAirport: u.DestinationAirport,
          departureDateTime: u.DepartureDateTime,
          meetingId: u.MeetingID,
        }));

        // Save in cache for next time
        this.cache.set(alertId, users);
      }

      if (!users?.length) continue; // Skip if no users found

      // Step 4c: Find what changed
      for (const u of users) {
        if (sequenceNumber <= (u.lastSequenceNumber || 0)) {
          console.log(
            `⏭️  Skipping old event for ${u.firstName} - Seq: ${sequenceNumber} vs Current: ${u.lastSequenceNumber}`
          );
          continue;
        }

        // Compare old vs new values
        if (u.status !== status || u.state !== state) {
          // Log the change
          console.log(
            `🔄 ${u.firstName} ${u.lastName} | ${u.status}→${status} | ${u.state}→${state}`
          );

          // Add to changes list
          changes.push({
            id: u.id,
            status,
            state,
            sequenceNumber,
            offset,
          });

          // Send email notification
          EmailService.sendStatusUpdateEmail(
            {
              EmailId: u.emailId,
              FirstName: u.firstName,
              LastName: u.lastName,
              CarrierCode: u.carrierCode,
              DepartureFlightNumber: u.flightNumber,
              OriginAirport: u.originAirport,
              DestinationAirport: u.destinationAirport,
              DepartureDateTime: u.departureDateTime,
            },
            { status, state, time }
          ).catch((err) => console.error("❌ Email error:", err.message));

          // WebSocket broadcast
          WebSocketService.broadcastFlightUpdate(u, alertId, status, state);

          // Update cache
          u.status = status;
          u.state = state;
          u.lastSequenceNumber = sequenceNumber;
          u.lastEventOffset = offset;
        }
      }

      // Step 4d: Save updated cache
      this.cache.set(alertId, users);
    }

    // Step 4e: Save all changes to database at once
    if (changes.length) {
      await this.bulkUpdate(changes);
      this.stats.updated += changes.length;
      console.log(`✅ Updated ${changes.length} record(s)`);
    }
  }

  // STEP 5: Save multiple records to database efficiently
  async bulkUpdate(updates) {
    const t = await sequelize.transaction(); // Start database transaction

    try {
      // Run SQL query to update multiple records at once
      await sequelize.query(
        `UPDATE "MeetingUser" m 
         SET "Status" = u.s, 
           "State" = u.st, 
           "LastSequenceNumber" = u.seq,
           "LastEventOffset" = u.off,
           "ModifiedDate" = NOW()
         FROM (SELECT * FROM UNNEST($1::int[], $2::text[], $3::text[], $4::bigint[], $5::text[])) 
            AS u(id, s, st, seq, off)
         WHERE m."Id" = u.id`,
        {
          bind: [
            updates.map((u) => u.id), // Array of IDs
            updates.map((u) => u.status), // Array of statuses
            updates.map((u) => u.state), // Array of states
            updates.map((u) => u.sequenceNumber),
            updates.map((u) => u.offset),
          ],
          transaction: t,
        }
      );

      await t.commit(); // Save changes
    } catch (err) {
      await t.rollback(); // Undo if error
      this.stats.errors++;
      console.error("❌ Bulk update failed:", err.message);
    }
  }

  // STEP 6: Log statistics every 30 seconds
  logStats() {
    const uptime = Math.floor((Date.now() - this.stats.start) / 1000);
    console.log(
      `📊 ${Math.floor(uptime / 60)}m | RX: ${
        this.stats.received
      } | Processed: ${this.stats.processed} | Updated: ${
        this.stats.updated
      } | Errors: ${this.stats.errors}`
    );
  }

  // STEP 7: Stop the service gracefully
  async stop() {
    if (!this.isRunning) return;
    console.log("🛑 Stopping...");

    // Stop stats logging
    if (this.statsInterval) clearInterval(this.statsInterval);

    // Process remaining events
    if (this.queue.length) await this.processBatch();

    // Close connections
    if (this.subscription) await this.subscription.close();
    if (this.client) await this.client.close();

    // Clear cache
    this.cache.flushAll();
    this.isRunning = false;
    console.log("✅ Stopped");
  }

  // STEP 8: Get current service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: Math.floor((Date.now() - this.stats.start) / 1000),
      stats: this.stats,
      cacheSize: this.cache.keys().length,
      queueSize: this.queue.length,
    };
  }
}

export default new EventHubService();
