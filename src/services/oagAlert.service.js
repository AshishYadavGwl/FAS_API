import axios from "axios";
import MeetingUser from "../models/MeetingUser.js";
import { sequelize } from "../config/database.js";
import OagUtils from "../utils/oag.utils.js";

const oagClient = axios.create({
  baseURL: process.env.OAG_BASE_URL,
  timeout: 30000,
  headers: {
    "Subscription-Key": process.env.OAG_SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
  },
});

export async function createAlerts(usersData) {
  const results = { success: [], incomplete: [] };

  const promises = usersData.map(async (user) => {
    try {
      const isValid = OagUtils.isValidFlightData(user);
      const departureDate = isValid
        ? OagUtils.formatDate(user.DepartureDateTime)
        : null;

      // Invalid data - delete alert if exists
      if (!isValid || !departureDate) {
        if (user.AlertId?.trim())
          await deleteAlert(user.AlertId).catch(() => {});
        results.incomplete.push(user.Id);
        return;
      }

      let shouldCreateNew = true;

      // Check if alert needs update
      if (user.AlertId?.trim()) {
        const oldUser = await MeetingUser.findByPk(user.Id, {
          attributes: [
            "CarrierCode",
            "DepartureFlightNumber",
            "DepartureDateTime",
          ],
          raw: true,
        });

        if (oldUser && !OagUtils.hasFlightDataChanged(oldUser, user)) {
          results.success.push({ id: user.Id, alertId: user.AlertId });
          shouldCreateNew = false;
        } else {
          await deleteAlert(user.AlertId).catch(() => {});
        }
      }

      // Create new alert
      if (shouldCreateNew) {
        const payload = OagUtils.buildOagPayload(
          user.CarrierCode,
          user.DepartureFlightNumber,
          departureDate
        );

        const response = await oagClient.post("", payload);
        const alertId =
          response.data?.alertId ||
          response.data?.data ||
          response.data?.AlertId;
        results.success.push({ id: user.Id, alertId });
      }
    } catch (error) {
      const duplicateAlertId = OagUtils.extractAlertIdFromError(error);
      if (duplicateAlertId) {
        results.success.push({ id: user.Id, alertId: duplicateAlertId });
        return;
      }
      results.incomplete.push(user.Id);
    }
  });

  await Promise.allSettled(promises);
  await bulkUpdateMeetingUsers(results);

  return {
    processed: usersData.length,
    created: results.success.length,
    failed: results.incomplete.length,
  };
}

// Delete alert
async function deleteAlert(alertId) {
  try {
    const deleteUrl = `https://api.oag.com/flight-info-alerts/alerts/${alertId}?version=v1`;
    await axios.delete(deleteUrl, {
      headers: {
        "Subscription-Key": process.env.OAG_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
    return true;
  } catch (error) {
    if (error.response?.status === 404) return true;
    throw error;
  }
}

// Bulk update DB with UNNEST
async function bulkUpdateMeetingUsers(results) {
  const t = await sequelize.transaction();

  try {
    if (results.success.length > 0) {
      await sequelize.query(
        `UPDATE "MeetingUser" AS m SET 
          "AlertId" = u.alert_id, "Status" = 'No Take Off Info', 
          "State" = 'No Take Off Info', "ModifiedDate" = NOW()
        FROM (SELECT * FROM UNNEST($1::int[], $2::text[])) AS u(user_id, alert_id)
        WHERE m."Id" = u.user_id`,
        {
          bind: [
            results.success.map((u) => u.id),
            results.success.map((u) => u.alertId),
          ],
          transaction: t,
        }
      );
    }

    if (results.incomplete.length > 0) {
      await sequelize.query(
        `UPDATE "MeetingUser" SET 
          "AlertId" = NULL, "Status" = 'Incomplete Information', 
          "State" = 'Incomplete Information', "ModifiedDate" = NOW()
        WHERE "Id" = ANY($1::int[])`,
        { bind: [results.incomplete], transaction: t }
      );
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}
