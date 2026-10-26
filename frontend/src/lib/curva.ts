// Um único Bézier cúbico atravessa o hero de baixo à esquerda até em cima à
// direita. A curva começa rasa e baixa (base de garrafa, quase encostada no pé
// da tela), sobe no meio e volta a deitar no alto (gargalo) — a inflexão fica
// na metade direita.
//
// Começa fora do quadro de propósito: o "b" entra cortado pela borda esquerda,
// e o pé das letras é cortado pela borda de baixo.
export const CURVA = "M -80 604 C 640 564 1080 334 1560 274";

// A mesma ideia no espaço do fundo (viewBox 1600x900), mais baixa e mais
// larga: é a cópia apagada que fica atrás de tudo e desce/sobe com o scroll.
export const CURVA_FUNDO = "M -240 1120 C 620 1060 1200 620 1800 540";
