export const REDES = [
  { nome: 'Zona Sul', slug: 'zona-sul' },
  { nome: 'HNT', slug: 'hnt' },
  { nome: 'Mambo', slug: 'mambo' },
  { nome: 'Obae', slug: 'obae' },
  { nome: 'St Marche', slug: 'st-marche' },
  { nome: 'Hippo', slug: 'hippo' },
];

export const REDE_PADRAO = REDES[0].nome;

export function redeBySlug(slug) {
  return REDES.find((r) => r.slug === slug) || null;
}
