// Dados de exemplo (baseados nos mockups, com nomes genéricos).

const C = (id, nome, grupo, icon, tone, orc) => ({ id, nome, grupo, icon, tone, orc });

const CATEGORIAS = [
  C('aluguel', 'Aluguel', 'fixa', 'casa', 'nota-100', 1200),
  C('pensao', 'Pensão', 'fixa', 'pessoa', 'nota-5', 500),
  C('parcela-moto', 'Parcela moto', 'fixa', 'carro', 'nota-2', 690),
  C('tv', 'TV e IPTV', 'fixa', 'tv', 'nota-100', 35),
  C('seguro', 'Seguro de vida', 'fixa', 'saude', 'nota-10', 189),
  C('cartao-santander', 'Cartão Santander', 'fixa', 'cartao', 'nota-200', 0),
  C('mercado', 'Mercado', 'variavel', 'mercado', 'nota-20', 1200),
  C('alimentacao', 'Alimentação fora', 'variavel', 'garfo', 'nota-50', 500),
  C('gasolina', 'Gasolina', 'variavel', 'carro', 'nota-2', 400),
  C('petshop', 'Petshop', 'variavel', 'pata', 'nota-50', 300),
  C('funcionarios', 'Funcionários', 'variavel', 'pessoa', 'nota-200', 800),
  C('lazer', 'Lazer', 'variavel', 'lazer', 'nota-5', 250),
  C('saude', 'Saúde', 'variavel', 'saude', 'nota-10', 0),
  C('cuidados', 'Cuidados pessoais', 'variavel', 'pessoa', 'nota-10', 0),
  C('compras', 'Compras', 'variavel', 'sacola', 'nota-200', 0),
  C('educacao', 'Educação', 'variavel', 'escola', 'nota-5', 0),
  C('outros', 'Outros', 'variavel', 'sacola', 'nota-200', 0),
  C('reserva-emergencia', 'Reserva de emergência', 'reserva', 'cofre', 'violet', 600),
  C('viagem', 'Viagem de férias', 'reserva', 'cofre', 'violet', 0),
  C('mesada', 'Mesada filhos', 'reserva', 'cofre', 'violet', 200),
  C('salario', 'Salário', 'entrada', 'entrada', 'jade', 7450),
  C('projetos', 'Projetos', 'entrada', 'entrada', 'jade', 0),
  C('reembolso', 'Reembolso', 'entrada', 'transferencia', 'jade', 0),
  C('outras-entradas', 'Outras entradas', 'entrada', 'entrada', 'jade', 0)
];

const REGRAS = [
  ['SONDA', 'mercado'], ['SHELL', 'gasolina'], ['ALUGUEL', 'aluguel'], ['PENSAO', 'pensao'],
  ['BANHO E TOSA', 'petshop'], ['VETCARE', 'petshop'], ['DIARISTA', 'funcionarios'], ['FATURA SANTANDER', 'cartao-santander'],
  ['IPTV', 'tv'], ['SEGURO VIDA', 'seguro'], ['TABACARIA', 'alimentacao']
].map(([chave, catId], i) => ({ id: 'r' + (i + 1), chave, catId }));

let n = 0;
// L(data, desc, catId, valor, conta, forma, extra)
const L = (data, desc, catId, valor, conta = 'Itaú', forma = 'Pix', extra = {}) => ({
  id: 's' + (++n), data, desc, catId, valor, conta, forma, parc: '', origem: 'auto', obs: '', tipo: 'despesa', ...extra
});

const PENDENTES = [
  L('2026-11-07', 'PIX Descendência', null, 120, 'Itaú', 'Pix', { sugestao: 'outros', chave: 'DESCENDENCIA' }),
  L('2026-11-07', 'PIX Studio Pilates', null, 180, 'Itaú', 'Pix', { sugestao: 'cuidados', chave: 'STUDIO PILATES' }),
  L('2026-11-07', 'ZP*ARR Comércio', null, 89.9, 'Cartão Itaú', 'Crédito', { sugestao: 'compras', chave: 'ZP*ARR' })
];

const NOVEMBRO = [
  L('2026-11-05', 'Salário', 'salario', 7450),
  L('2026-11-05', 'Cofrinho dos filhos', 'mesada', 200),
  L('2026-11-05', 'Banho e tosa', 'petshop', 90),
  L('2026-11-05', 'Aplicação Reserva', 'reserva-emergencia', 600),
  L('2026-11-05', 'Pensão', 'pensao', 500),
  L('2026-11-03', 'Sonda Supermercados', 'mercado', 544.67, 'Itaú', 'Débito'),
  L('2026-11-03', 'Jantar', 'alimentacao', 186),
  L('2026-11-03', 'IPTV', 'tv', 35),
  L('2026-11-02', 'Posto Shell', 'gasolina', 250),
  L('2026-11-02', 'Feira do bairro', 'mercado', 95.33),
  L('2026-11-01', 'Aluguel', 'aluguel', 1200),
  L('2026-11-01', 'Parcela moto', 'parcela-moto', 689.9, 'Cartão Itaú', 'Crédito', { parc: '7/24' }),
  L('2026-11-01', 'iFood', 'alimentacao', 244, 'Cartão Itaú', 'Crédito'),
  L('2026-11-01', 'Posto Ipiranga', 'gasolina', 220, 'Itaú', 'Débito')
];

// Meses anteriores, para a troca de mês no Painel e o Orçamento de 3 meses / ano.
function mesPassado(ym, cfg) {
  const d = (dia) => ym + '-' + String(dia).padStart(2, '0');
  return [
    L(d(27), 'Restaurante', 'alimentacao', cfg.alim2),
    L(d(22), 'Posto Shell', 'gasolina', cfg.gas2),
    L(d(20), 'Sonda Supermercados', 'mercado', cfg.merc2, 'Itaú', 'Débito'),
    L(d(14), 'Jantar', 'alimentacao', cfg.alim1),
    L(d(12), 'Feira do bairro', 'mercado', cfg.merc1),
    L(d(10), 'Seguro de vida', 'seguro', 189, 'Itaú', 'Débito'),
    L(d(8), 'Posto Ipiranga', 'gasolina', cfg.gas1, 'Itaú', 'Débito'),
    ...(cfg.extra || []).map((e) => L(d(e[0]), e[1], e[2], e[3], 'Itaú', e[4] || 'Pix')),
    L(d(5), 'Salário', 'salario', cfg.salario),
    ...(cfg.mesada ? [L(d(5), 'Cofrinho dos filhos', 'mesada', cfg.mesada)] : []),
    L(d(5), 'Aplicação Reserva', 'reserva-emergencia', cfg.reserva),
    L(d(5), 'Pensão', 'pensao', 500),
    L(d(3), 'IPTV', 'tv', 35),
    L(d(1), 'Aluguel', 'aluguel', 1200),
    L(d(1), 'Parcela moto', 'parcela-moto', 689.9, 'Cartão Itaú', 'Crédito', { parc: cfg.parc })
  ];
}

const OUTUBRO = mesPassado('2026-10', {
  salario: 7160, reserva: 600, mesada: 200, parc: '6/24',
  merc1: 180, merc2: 340, gas1: 120, gas2: 110, alim1: 96.6, alim2: 94,
  extra: [[15, 'IPVA 2026', 'outros', 480, 'Boleto']]
});
const SETEMBRO = mesPassado('2026-09', {
  salario: 7450, reserva: 600, parc: '5/24',
  merc1: 230, merc2: 380, gas1: 140, gas2: 120, alim1: 118.1, alim2: 110
});
const AGOSTO = mesPassado('2026-08', {
  salario: 6980, reserva: 500, parc: '4/24',
  merc1: 290, merc2: 390, gas1: 160, gas2: 140, alim1: 106.1, alim2: 100,
  extra: [[18, 'Banho e tosa', 'petshop', 90]]
});

const LANCAMENTOS = [...PENDENTES, ...NOVEMBRO, ...OUTUBRO, ...SETEMBRO, ...AGOSTO];

// Metas: o valor guardado = inicial + soma das Reservas lançadas na categoria da meta.
function meta(id, nome, catId, guardadoAlvo, target, mensal) {
  const lancado = LANCAMENTOS.filter((l) => l.catId === catId).reduce((s, l) => s + l.valor, 0);
  return { id, nome, catId, inicial: Math.round((guardadoAlvo - lancado) * 100) / 100, target, mensal };
}

export const IDS_PENDENTES_EXEMPLO = PENDENTES.map((p) => p.id);

export function dadosExemplo() {
  const lancs = JSON.parse(JSON.stringify(LANCAMENTOS));
  return {
    versao: 1,
    cats: JSON.parse(JSON.stringify(CATEGORIAS)),
    regras: JSON.parse(JSON.stringify(REGRAS)),
    lancs,
    metas: [
      meta('m1', 'Reserva de emergência', 'reserva-emergencia', 6200, 15000, 600),
      meta('m2', 'Viagem de férias', 'viagem', 1800, 6000, 500),
      meta('m3', 'Mesada filhos', 'mesada', 400, 1200, 200)
    ],
    escolhas: {},
    ajustes: { diaria: true, claude: true, aviso: false },
    importacao: { quando: '2026-11-07T07:02:00', trouxe: 5 },
    metaMensal: 1000,
    mes: '2026-11'
  };
}
