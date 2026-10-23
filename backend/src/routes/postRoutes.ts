import { createPost, getPost, listPosts } from "../controllers/postController";
import { Router } from "express";
import { auth } from "../middlewares/auth";


// Creates an Express router: a way to group related routes
const router = Router();

// POST /posts -> creates a new post (createPost).
router.post("/posts", auth, createPost);

// GET /posts -> lists all posts (listPosts).
// Same URL as above, but a different HTTP method.
// Express uses the METHOD to tell the two routes apart.
router.get("/posts", listPosts);
// GET /posts/:id -> returns one post (getPost).
// The :id part is a route parameter, available in req.params.id
router.get("/posts/:id", getPost);

export default router;