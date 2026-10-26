// Desenho do fundo: um núcleo de processador no centro da tela com trilhas
// saindo dele em quatro direções, estilo placa de circuito (retas + chanfro
// de 45°).
//
// Tudo é gerado com um sorteio de semente fixa: o mesmo desenho em toda build,
// no servidor e no cliente, então não há mismatch de hidratação e o SVG pode
// ser renderizado direto no HTML.
//
// As cores ficam em variáveis CSS (globals.css), então claro e escuro usam o
// mesmo desenho com paletas diferentes.

export type Ponto = { x: number; y: number };

export type Trilha = {
  d: string;
  espessura: number;
};

export type Terminal = {
  x: number;
  y: number;
  raio: number;
};

export const CIRCUITO = {
  largura: 1600,
  altura: 1000,
  centroX: 800,
  centroY: 500,
  // Metade do lado do corpo do núcleo.
  nucleo: 64,
};

// mulberry32: pequeno, determinístico e suficiente para espalhar as trilhas.
function criarSorteio(semente: number) {
  let estado = semente >>> 0;

  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Gira em quartos de volta (sentido anti-horário) em torno do centro.
function rotacionar(ponto: Ponto, quartos: number): Ponto {
  let { x, y } = ponto;

  for (let i = 0; i < quartos; i++) {
    const anterior = x;
    x = -y;
    y = anterior;
  }

  return { x, y };
}

function caminho(pontos: Ponto[]) {
  return pontos
    .map((ponto, indice) => `${indice === 0 ? "M" : "L"} ${ponto.x} ${ponto.y}`)
    .join(" ");
}

// Um braço é desenhado apontando para a direita, a partir da borda do núcleo.
// Depois o mesmo braço é girado para as outras três direções.
type Braco = {
  pontos: Ponto[];
  espessura: number;
};

function criarBraco(rnd: () => number): Braco[] {
  const metade = CIRCUITO.nucleo;
  const trilhas: Braco[] = [];
  const quantidade = 9;

  for (let i = 0; i < quantidade; i++) {
    // Distribui as saídas ao longo da borda do núcleo.
    const y0 = -metade + 16 + i * ((2 * metade - 32) / (quantidade - 1));

    const saida = 24 + rnd() * 70; // reta que sai do núcleo
    const chanfro = 14 + rnd() * 40; // diagonal de 45°
    const direcao = i % 2 === 0 ? 1 : -1;
    const alcance = 120 + rnd() * 380; // reta final

    const x1 = metade + saida;
    const x2 = x1 + chanfro;
    const y1 = y0 + direcao * chanfro;
    const x3 = x2 + alcance;

    // Algumas trilhas terminam no chanfro, como um via de placa.
    const pontos: Ponto[] =
      i % 4 === 1
        ? [
            { x: metade, y: y0 },
            { x: x1, y: y0 },
            { x: x2, y: y1 },
          ]
        : [
            { x: metade, y: y0 },
            { x: x1, y: y0 },
            { x: x2, y: y1 },
            { x: x3, y: y1 },
          ];

    trilhas.push({ pontos, espessura: 1 + rnd() * 0.9 });
  }

  return trilhas;
}

export function criarCircuito() {
  const rnd = criarSorteio(0x5eed);
  const braco = criarBraco(rnd);

  const trilhas: Trilha[] = [];
  const terminais: Terminal[] = [];

  for (let quartos = 0; quartos < 4; quartos++) {
    for (const item of braco) {
      const pontos = item.pontos.map((ponto) => {
        const girado = rotacionar(ponto, quartos);

        return {
          x: CIRCUITO.centroX + girado.x,
          y: CIRCUITO.centroY + girado.y,
        };
      });

      trilhas.push({ d: caminho(pontos), espessura: item.espessura });

      const fim = pontos[pontos.length - 1];
      terminais.push({
        x: fim.x,
        y: fim.y,
        raio: 2.4 + item.espessura,
      });
    }
  }

  return { trilhas, terminais };
}
