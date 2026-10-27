import { Router } from "express";
import { createUser, getMe, login, updateMe } from "../controllers/userController";
import { auth } from "../middlewares/auth";
import { cadastroLimiter, loginLimiter } from "../middlewares/rateLimit";

// Creates an Express router: a way to group related routes
const router = Router();

// POST /users -> calls createUser to register a new user.
// POST is the HTTP method for "create a new resource".
// cadastroLimiter entra antes: barra spam de contas vindas do mesmo IP.
router.post("/users", cadastroLimiter, createUser);

// loginLimiter entra antes: barra força bruta de senha.
router.post("/login", loginLimiter, login);

// Perfil do próprio usuário logado. "me" no lugar de :id evita que alguém
// tente editar a conta de outra pessoa trocando o número na URL.
router.get("/users/me", auth, getMe);
router.patch("/users/me", auth, updateMe);

export default router;
