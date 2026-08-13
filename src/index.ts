import "dotenv/config";
import express from "express";
import router from "./routes/userRoutes";

const app = express();

app.use(express.json());
app.use(router);

//routes come here

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

console.log("Conectado!")