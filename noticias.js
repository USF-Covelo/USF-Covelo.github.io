/* =====================================================================
   NOTÍCIAS DA USF COVELO (EDITAR AQUI)
   Para acrescentar uma notícia, copie um bloco { … }, cole-o no INÍCIO
   da lista (a mais recente fica primeiro) e altere os dados.
   - id:      nome curto, sem espaços nem acentos (aparece no endereço da página)
   - data:    no formato AAAA-MM-DD
   - capa:    imagem que aparece no cartão da página inicial e da lista
   - imagem:  imagem que aparece no topo da notícia (pode ser igual à capa)
   - video:   ficheiro de vídeo (opcional; deixe "" se não houver)
   - resumo:  uma ou duas frases para o cartão
   - texto:   parágrafos da notícia, cada um entre aspas e separados por vírgulas
   Os ficheiros de imagem e de vídeo têm de estar no repositório, ao lado das páginas.
   ===================================================================== */
const NOTICIAS = [
  {
    id: "gasa-ribadouro",
    titulo: "USF Covelo volta ao Ribadouro para projeto de apoio à saúde do adolescente - GASA",
    data: "2026-11-16", // EDITAR: confirme a data
    capa: "noticia-gasa-capa.jpg",
    imagem: "noticia-gasa-logo.jpg",
    video: "noticia-gasa.mp4",
    resumo: "A USF Covelo regressou ao Ribadouro no âmbito do GASA – Gabinete de Apoio à Saúde do Adolescente.",
    texto: [
      // EDITAR: substitua ou complete este texto
      "A USF Covelo voltou ao Ribadouro para dar continuidade ao GASA – Gabinete de Apoio à Saúde do Adolescente, um projeto dedicado à saúde dos jovens.",
      "Veja no vídeo abaixo como decorreu."
    ]
  }
];

/* ===== A partir daqui não precisa de editar ===== */
function dataNoticia(iso) {
  const lingua = document.documentElement.lang || "pt-PT";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString(lingua, { day: "numeric", month: "long", year: "numeric" });
}

function cartaoNoticia(n) {
  return `<a class="noticia-cartao" href="noticia.html?id=${encodeURIComponent(n.id)}">
    <div class="noticia-img"${n.capa ? ` style="background-image:url('${n.capa}')"` : ""}></div>
    <div class="noticia-corpo">
      <h3>${n.titulo}</h3>
      <time datetime="${n.data}">${dataNoticia(n.data)}</time>
    </div>
  </a>`;
}

function renderNoticias() {
  // Página inicial: as 3 mais recentes
  const inicio = document.getElementById("ultimas-noticias");
  if (inicio) inicio.innerHTML = NOTICIAS.slice(0, 3).map(cartaoNoticia).join("");

  // Página "Notícias": todas
  const todas = document.getElementById("lista-noticias");
  if (todas) todas.innerHTML = NOTICIAS.length ? NOTICIAS.map(cartaoNoticia).join("")
    : '<p class="sub">Ainda não há notícias publicadas.</p>';

  // Página de uma notícia
  const artigo = document.getElementById("artigo-noticia");
  if (artigo) {
    const id = new URLSearchParams(location.search).get("id");
    const n = NOTICIAS.find(x => x.id === id) || NOTICIAS[0];
    if (!n) { artigo.innerHTML = '<p class="sub">Notícia não encontrada.</p>'; return; }
    document.title = n.titulo + " · USF Covelo";
    artigo.innerHTML = `
      ${n.imagem ? `<img class="artigo-imagem" src="${n.imagem}" alt="">` : ""}
      <div class="artigo-texto">
        <time datetime="${n.data}">${dataNoticia(n.data)}</time>
        <h1>${n.titulo}</h1>
        ${n.texto.map(p => `<p>${p}</p>`).join("")}
        ${n.video ? `<video class="artigo-video" controls preload="metadata" playsinline${n.capa ? ` poster="${n.capa}"` : ""}><source src="${n.video}" type="video/mp4">O seu navegador não consegue mostrar este vídeo.</video>` : ""}
        <p class="voltar"><a href="noticias.html">← Ver todas as notícias</a></p>
      </div>`;
    const outras = document.getElementById("outras-noticias");
    const resto = NOTICIAS.filter(x => x !== n).slice(0, 3);
    if (outras && resto.length) {
      outras.innerHTML = resto.map(cartaoNoticia).join("");
      outras.closest("section").hidden = false;
    }
  }
}
