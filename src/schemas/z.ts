import { z } from "zod";
import { ptBR } from "zod/locales";

// Configuração global: todas as mensagens de erro saem em português.
// Fica isolada neste módulo para rodar uma única vez, antes de qualquer
// schema validar. Todo schema importa o "z" daqui, não o do pacote direto.
z.config(z.locales.ptBR());

export { z };