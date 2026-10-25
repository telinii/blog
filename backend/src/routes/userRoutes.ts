import { Router } from "express";
import { createUser, login } from "../controllers/userController";
import { cadastroLimiter, loginLimiter } from "../middlewares/rateLimit";

// Creates an Express router: a way to group related routes
const router = Router();

// POST /users -> calls createUser to register a new user.
// POST is the HTTP method for "create a new resource".
// cadastroLimiter entra antes: barra spam de contas vindas do mesmo IP.
router.post("/users", cadastroLimiter, createUser);

// loginLimiter entra antes: barra força bruta de senha.
router.post("/login", loginLimiter, login);

export default router;
