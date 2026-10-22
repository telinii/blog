// Loads environment variables from .env before anything else reads process.env
import "./env";
import express, { ErrorRequestHandler } from "express";
import postRoutes from "./routes/postRoutes";
import router from "./routes/userRoutes";

// Fail fast: without the secret every POST /login would build an invalid token
// and blow up later with a confusing error. Better refuse to start.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não está definida no .env");
}

// Creates the Express application
const app = express();

// express.json() parses JSON bodies sent by clients into req.body.
// IMPORTANT: it must come BEFORE the routes, otherwise req.body arrives undefined.
app.use(express.json());

// Mounts the post routes (/posts) and user routes (/users)
app.use(postRoutes);
app.use(router);

// Health check for the root URL (avoids "Cannot GET /")
app.get("/", (req, res) => {
  res.json({ message: "API Blog online", endpoints: ["/users", "/login", "/posts"] });
});

// Unknown route -> JSON 404 instead of Express's default HTML page.
// Must come AFTER all routes and BEFORE the error handler.
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

// Central error handler -> every unexpected error answers JSON, never a stack trace.
// Express identifies it as an error handler because it takes 4 arguments.
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Malformed JSON body, thrown by express.json()
  if (err instanceof SyntaxError) {
    res.status(400).json({ erro: "JSON inválido" });
    return;
  }

  // Body bigger than the 100kb default limit
  if (err?.type === "entity.too.large") {
    res.status(413).json({ erro: "Corpo da requisição muito grande" });
    return;
  }

  console.error("Erro não tratado:", err);
  res.status(500).json({ erro: "Erro interno no servidor" });
};

app.use(errorHandler);

// Starts the HTTP server on port 3000
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
