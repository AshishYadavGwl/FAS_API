import express from "express";
import AuthController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/forgot-password", AuthController.sendResetLink);
router.post("/reset-password", AuthController.resetPassword);

export default router;
