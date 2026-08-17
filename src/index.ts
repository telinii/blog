import postRoutes from "./routes/postRoutes";
import "dotenv/config";
import express from "express";
import router from "./routes/userRoutes";

// Creates the Express application
const app = express();

// express.json() parses JSON bodies sent by clients into req.body.
// IMPORTANT: it must come BEFORE the routes, otherwise req.body arrives undefined.
app.use(express.json());

// Mounts the post routes (/posts) and user routes (/users)
app.use(postRoutes);
app.use(router);

// Starts the HTTP server on port 3000
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

console.log("Conectado!")