import express from "express";
import AuthController from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";
import Role from "../models/Role.js";
import ApiResponse from "../utils/response.js";

const router = express.Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.get("/roles", AuthController.getRoles);

router.post("/roles-create", async (req, res) => {
  try {
    const role = await Role.create(req.body);
    return ApiResponse.success(res, { role }, "Role created successfully");
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
});

router.get("/profile", authenticateToken, AuthController.getProfile);

export default router;
