// Decoração trazida do azul.com: em vez de uma linha solta, um leque de cópias
// paralelas da mesma curva. Cada cópia é um traço fino; juntas elas leem como
// uma fita, não como um risco.
//
// No SVG original deles as cópias caem ~20px e andam ~1.4px para a esquerda a
// cada passo — quase só deslocamento vertical, com uma deriva mínima. É essa
// proporção que faz o leque parecer uma superfície em perspectiva em vez de um
// monte de linhas empilhadas.

export type Leque = {
  /** Quantas cópias da curva. Ímpar mantém uma delas exatamente sobre a base. */
  copias: number;
  /** Quanto cada cópia desce em relação à vizinha, em unidades do viewBox. */
  passoY: number;
  /** Quanto cada cópia anda para a esquerda, em unidades do viewBox. */
  passoX: number;
};

/**
 * Deslocamentos do leque, centrados na curva original — a cópia do meio fica
 * em (0, 0), então a fita cresce para os dois lados e não descola da base.
 */
export function deslocamentos({ copias, passoY, passoX }: Leque) {
  const meio = (copias - 1) / 2;

  return Array.from({ length: copias }, (_, i) => {
    const passo = i - meio;
    return { dx: passo * passoX, dy: passo * passoY };
  });
}
