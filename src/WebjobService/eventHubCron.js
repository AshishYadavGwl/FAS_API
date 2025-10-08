import cron from "node-cron";
import EventHubService from "./eventHubService.js";

class EventHubCron {
  constructor() {
    this.isRunning = false;
    this.hoursAhead = 48; // Default 48 hours
    this.cronJob = null;
  }

  /**
   * Automatic sync function - cron se call hoga
   * Prevents duplicate runs if previous sync still running
   */
  async runSync() {
    if (this.isRunning) {
      console.log("⏸️  Sync already running, skipping this iteration");
      return;
    }

    this.isRunning = true;
    const timestamp = new Date().toISOString();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 AUTOMATIC SYNC STARTED - ${timestamp}`);
    console.log(`⏰ Time Window: Next ${this.hoursAhead} hours`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      // Call the sync service
      const stats = await EventHubService.syncFlightStatus(this.hoursAhead);

      // Log results
      if (stats.success) {
        console.log(`✅ Sync Completed Successfully`);
        console.log(`📊 Users Found: ${stats.usersFound}`);
        console.log(`🎯 Users with Alerts: ${stats.usersWithAlerts}`);
        console.log(`📡 Events Received: ${stats.eventsReceived}`);
        console.log(`🔄 Status Changed: ${stats.statusChanged}`);
        console.log(
          `⏱️  Execution Time: ${(stats.executionTime / 1000).toFixed(2)}s`
        );
      } else {
        console.error(`❌ Sync Failed: ${stats.error}`);
      }
    } catch (error) {
      console.error(`💥 Cron Error: ${error.message}`);
    } finally {
      this.isRunning = false;
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🏁 SYNC FINISHED - ${new Date().toISOString()}`);
      console.log(`${"=".repeat(60)}\n`);
    }
  }

  /**
   * Start cron job - runs every hour at minute 0
   * Cron pattern: "0 * * * *"
   * - 0: minute 0
   * - *: every hour
   * - *: every day
   * - *: every month
   * - *: every day of week
   */
  start() {
    if (this.cronJob) {
      console.log("⚠️  Cron already running");
      return;
    }

    // Schedule: Every hour at :00
    this.cronJob = cron.schedule("0 * * * *", async () => {
      await this.runSync();
    });

    console.log("\n" + "=".repeat(60));
    console.log("⏰ EVENT HUB CRON JOB STARTED");
    console.log("=".repeat(60));
    console.log(`📅 Schedule: Every hour at minute 0`);
    console.log(`⏰ Time Window: ${this.hoursAhead} hours ahead`);
    console.log(`🔄 Next Run: Top of next hour`);
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Stop cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("🛑 Cron job stopped");
    }
  }

  /**
   * Update time window (24, 48, 72, etc.)
   */
  setHoursAhead(hours) {
    if (hours < 1 || hours > 168) {
      console.log("⚠️  Hours must be between 1 and 168");
      return;
    }
    this.hoursAhead = hours;
    console.log(`⚙️  Time window updated to ${hours} hours`);
  }

  /**
   * Get cron status
   */
  getStatus() {
    return {
      isActive: !!this.cronJob,
      isRunning: this.isRunning,
      hoursAhead: this.hoursAhead,
      schedule: "Every hour at :00",
    };
  }
}

export default new EventHubCron();
