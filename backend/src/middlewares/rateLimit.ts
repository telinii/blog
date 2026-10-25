import { rateLimit } from "express-rate-limit";

// Rate limit protege contra força bruta: sem ele, um atacante testa milhares
// de senhas por minuto contra POST /login. O contador é por IP.
//
// O store é em memória: zera quando o processo reinicia e cada instância tem o
// seu. Suficiente para um servidor só. Com mais de uma instância, troque por um
// store compartilhado (ex.: Redis) sem mudar as rotas.

const minutos = (n: number) => n * 60 * 1000;

// Lê o limite do ambiente; valor vazio ou inválido cai no padrão.
const limite = (nome: string, padrao: number) => Number(process.env[nome]) || padrao;

// A suíte de testes faz vários logins por execução e ficaria instável
// se o limite valesse lá.
const skipInTests = () => process.env.NODE_ENV === "test";

export const loginLimiter = rateLimit({
  windowMs: minutos(15),
  limit: limite("LOGIN_RATE_LIMIT_MAX", 5),
  standardHeaders: "draft-8", // manda os headers RateLimit-*
  legacyHeaders: false, // sem os antigos X-RateLimit-*
  // Só tentativa que falhou conta: quem acerta a senha não gasta cota.
  skipSuccessfulRequests: true,
  skip: skipInTests,
  message: { erro: "Muitas tentativas de login. Tente de novo em 15 minutos." },
});

export const cadastroLimiter = rateLimit({
  windowMs: minutos(60),
  limit: limite("CADASTRO_RATE_LIMIT_MAX", 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: skipInTests,
  message: { erro: "Muitos cadastros a partir deste IP. Tente de novo em 1 hora." },
});
