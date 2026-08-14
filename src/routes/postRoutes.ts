import { Router } from "express";
import { createPost } from "../controllers/postController";
import { listPosts } from "../controllers/postController";

const router = Router();

router.post("/posts", createPost);
router.get("/posts", listPosts);

export default router;