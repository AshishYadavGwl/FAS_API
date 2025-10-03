import dotenv from "dotenv";
dotenv.config();

const isDev = process.env.NODE_ENV !== "production";

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3000,

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "FAS_API",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret_key",
    expire: process.env.JWT_EXPIRE || "7d",
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  logging: isDev,
};

export default config;
