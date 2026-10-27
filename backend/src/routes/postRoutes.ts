import { createPost, getPost, listPosts, updatePost } from "../controllers/postController";
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { publicLimiter } from "../middlewares/rateLimit";
import { uploadCapa } from "../middlewares/uploadCapa";


// Creates an Express router: a way to group related routes
const router = Router();

// POST /posts -> creates a new post (createPost).
// uploadCapa lê multipart/form-data; em JSON ele não faz nada e o
// express.json() já deixou o body pronto.
router.post("/posts", auth, uploadCapa, createPost);

// PATCH /posts/:id -> edita um post. Só o autor pode (checado no controller).
// uploadCapa permite trocar a foto; "removerCapa=true" apaga a atual.
router.patch("/posts/:id", auth, uploadCapa, updatePost);

// GET /posts -> lists all posts (listPosts).
// Same URL as above, but a different HTTP method.
// Express uses the METHOD to tell the two routes apart.
router.get("/posts", publicLimiter, listPosts);
// GET /posts/:id -> returns one post (getPost).
// The :id part is a route parameter, available in req.params.id
router.get("/posts/:id", publicLimiter, getPost);

export default router;