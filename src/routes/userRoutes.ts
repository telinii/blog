import { Router } from "express";
import { createUser, login } from "../controllers/userController";

// Creates an Express router: a way to group related routes
const router = Router();

// POST /users -> calls createUser to register a new user.
// POST is the HTTP method for "create a new resource".
router.post("/users", createUser);
router.post("/login", login);

export default router;