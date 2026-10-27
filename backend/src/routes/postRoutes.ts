import { createPost, deletePost, getPost, listDrafts, listPosts, updatePost } from "../controllers/postController";
import { Router } from "express";
import { auth, authOpcional } from "../middlewares/auth";
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

// DELETE /posts/:id -> apaga o post. Só o autor pode (checado no controller).
// A capa some do disco junto com a linha.
router.delete("/posts/:id", auth, deletePost);

// GET /posts -> lists all posts (listPosts).
// Same URL as above, but a different HTTP method.
// Express uses the METHOD to tell the two routes apart.
router.get("/posts", publicLimiter, listPosts);

// GET /rascunhos -> rascunhos do dono do token (listDrafts).
// Rota separada de /posts/:id de propósito: o filtro pelo autor vem do
// token, então esta listagem nunca mistura posts de duas pessoas.
router.get("/rascunhos", auth, publicLimiter, listDrafts);

// GET /posts/:id -> returns one post (getPost).
// The :id part is a route parameter, available in req.params.id
// authOpcional: sem token a rota continua pública; com token, o autor
// enxerga o próprio rascunho.
router.get("/posts/:id", authOpcional, publicLimiter, getPost);

export default router;