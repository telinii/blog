// Um único Bézier cúbico atravessa o hero de baixo à esquerda até em cima à
// direita. A curva começa rasa e baixa (base de garrafa, quase encostada no pé
// da tela), sobe no meio e volta a deitar no alto (gargalo) — a inflexão fica
// na metade direita.
//
// Começa fora do quadro de propósito: assim a fita entra cortada pela borda
// esquerda, em vez de terminar solta no meio do hero.
export const CURVA = "M -80 604 C 640 564 1080 334 1560 274";

// A mesma ideia no espaço do fundo (viewBox 1600x900), deslocada para baixo:
// é a cópia apagada que fica atrás de tudo e desce/sobe com o scroll. O rabicho
// no fim só existe para a palavra nunca bater no fim do caminho e ser fatiada.
export const CURVA_FUNDO =
  "M 0 860 C 560 820 1120 520 1660 450 C 1800 435 1950 425 2100 420";
