import { Sequelize } from "sequelize";
import config from "./config.js";

const isProd = config.env === "production";

const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.username,
  password: config.database.password,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: config.logging ? console.log : false,

  pool: {
    max: isProd ? 20 : 10, // More connections in production
    min: isProd ? 5 : 2, // Keep minimum alive
    acquire: 60000, // Increased timeout (60s)
    idle: 10000, // Close idle connections after 10s
    evict: 1000, // Check for idle connections every 1s
    maxUses: 5000, // Close connection after 5000 uses
  },

  benchmark: config.logging,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  retry: {
    max: 3,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    if (config.logging) console.log("Database connected");

    // Only sync in development
    if (!isProd) {
      await sequelize.sync({ alter: true });
      if (config.logging) console.log("Database synced");
    }
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export { sequelize, connectDB };
