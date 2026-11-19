/* =====================================================================
   NOTÍCIAS DA USF COVELO (EDITAR AQUI)
   Para acrescentar uma notícia, copie um bloco { … } inteiro, cole-o na
   lista e altere os dados. As notícias aparecem ordenadas pela data
   (a mais recente primeiro).
   - id:      nome curto, sem espaços nem acentos (aparece no endereço da página)
   - data:    no formato AAAA-MM-DD
   - capa:    imagem do cartão (página inicial e lista de notícias)
   - imagem:  imagem do topo da notícia
   - video:   ficheiro de vídeo da própria USF (opcional; "" se não houver)
   - resumo:  uma ou duas frases (opcional)
   - texto:   o corpo da notícia, por esta ordem. Cada elemento pode ser:
        "um parágrafo"
        { titulo: "um subtítulo" }
        { lista: ["Tema: explicação", "Outro tema: explicação"] }
             (o que estiver antes dos dois pontos aparece a negrito)
        { video: true }          → mostra aqui o vídeo indicado em "video"
        { instagram: "endereço de uma publicação ou reel do Instagram" }
   Os ficheiros de imagem e de vídeo têm de estar no repositório, ao lado das páginas.
   ===================================================================== */
const NOTICIAS = [
  {
    id: "gasa-ribadouro",
    titulo: "Os médicos da USF Covelo voltam ao Ribadouro para projeto de apoio à saúde do adolescente - GASA",
    data: "2026-11-16", // EDITAR: confirme a data
    capa: "noticia-gasa-capa.jpg",
    imagem: "noticia-gasa-logo.jpg",
    video: "noticia-gasa.mp4",
    resumo: "A USF Covelo regressou ao Ribadouro no âmbito do GASA – Gabinete de Apoio à Saúde do Adolescente.",
    texto: [
      "A Unidade de Saúde Familiar (USF) Covelo, em estreita parceria com o Colégio Ribadouro, dinamiza o Projeto GASA (Gabinete de Apoio à Saúde do Adolescente) — uma iniciativa de promoção da saúde e literacia em saúde dedicada especificamente à comunidade juvenil.",
      "Com uma periodicidade semanal, uma equipa composta por médicas de Medicina Geral e Familiar da USF Covelo desloca-se às instalações do Colégio Ribadouro para assegurar um espaço de atendimento, escuta ativa e aconselhamento clínico próximo e acessível.",
      "A adolescência é uma fase de profundas transformações físicas, emocionais e sociais, na qual a procura espontânea pelos cuidados de saúde primários nem sempre acontece. O Projeto GASA visa quebrar barreiras de acesso, levando os cuidados de saúde diretamente ao contexto escolar.",
      "Durante as sessões semanais, a equipa médica aborda de forma confidencial, empática e livre de juízos de valor as principais questões e desafios típicos desta faixa etária, nomeadamente:",
      { lista: [
        "Saúde Mental e Bem-Estar Emocional: Gestão do stress, ansiedade, autoestima e relações interpessoais.",
        "Saúde Sexual e Reprodutiva: Esclarecimento de dúvidas, prevenção de infeções sexualmente transmissíveis (IST) e planeamento familiar.",
        "Hábitos de Vida Saudáveis: Alimentação equilibrada, prática de exercício físico e higiene do sono.",
        "Prevenção de Comportamentos de Risco: Sensibilização sobre o consumo de substâncias (tabaco, álcool e outras) e o uso saudável das tecnologias e redes sociais."
      ] },
      { titulo: "Conheça o Projeto em Vídeo" },
      { video: true },
      "Com esta iniciativa, a USF Covelo reafirma o seu compromisso com a saúde comunitária e a medicina preventiva, apostando na capacitação dos jovens para que tomem decisões informadas e conscientes sobre a sua própria saúde e bem-estar."
    ]
  },
  {
    id: "congresso-ordem-medicos-2026",
    titulo: "A presença dos nossos médicos no Congresso da Ordem dos Médicos",
    data: "2026-11-13",
    capa: "noticia-congresso-capa.jpg",
    imagem: "noticia-congresso-topo.jpg",
    video: "",
    resumo: "A equipa médica da USF Covelo esteve no 29.º Congresso Nacional da Ordem dos Médicos, a 12 e 13 de novembro.",
    texto: [
      "Nos passados dias 12 e 13 de novembro, a equipa médica da USF Covelo esteve presente no Congresso da Ordem dos Médicos, este ano dedicado ao tema \"Um Médico num Mundo em Evolução\". Foram dois dias de partilha, debate e reflexão sobre os caminhos que a medicina está a trilhar.",
      "A participação ativa nestes encontros científicos faz parte do nosso compromisso diário com a atualização contínua. Num setor onde a tecnologia, a demografia e as próprias necessidades dos utentes mudam a um ritmo acelerado, parar para ouvir colegas de todo o país e discutir boas práticas é fundamental para continuar a prestar cuidados de excelência.",
      "Ao longo do congresso, o programa trouxe para cima da mesa questões muito concretas do nosso dia a dia na unidade, com especial foco em:",
      { lista: [
        "Inovação e Saúde Digital: O impacto da inteligência artificial e das novas ferramentas tecnológicas na prática clínica, sem nunca perder de vista a humanização e a relação médico-doente.",
        "Novos Paradigmas em Saúde: A adaptação dos serviços de saúde ao envelhecimento da população e à gestão cada vez mais complexa da doença crónica.",
        "Formação e Futuro da Profissão: Os desafios enfrentados pelas novas gerações de médicos e a importância de garantir condições para uma medicina sustentável e próxima das pessoas."
      ] },
      { titulo: "O congresso no Instagram da Ordem dos Médicos" },
      { instagram: "https://www.instagram.com/reel/Dfp-iHbNS01/" }
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

/* Corpo da notícia: parágrafos, subtítulos, listas, vídeo e Instagram */
function htmlVideo(n) {
  return `<video class="artigo-video" controls preload="metadata" playsinline${n.capa ? ` poster="${n.capa}"` : ""}><source src="${n.video}" type="video/mp4">O seu navegador não consegue mostrar este vídeo.</video>`;
}

function htmlInstagram(url) {
  const limpo = String(url).split("?")[0].replace(/\/?$/, "/");
  return `<figure class="artigo-instagram">
    <iframe src="${limpo}embed/" title="Vídeo da Ordem dos Médicos no Instagram" loading="lazy" allowfullscreen scrolling="no"></iframe>
    <figcaption>Vídeo publicado pela Ordem dos Médicos no Instagram. <a href="${limpo}" target="_blank" rel="noopener">Abrir no Instagram</a></figcaption>
  </figure>`;
}

function htmlCorpo(n) {
  let videoMostrado = false;
  const partes = n.texto.map(b => {
    if (typeof b === "string") return `<p>${b}</p>`;
    if (b.titulo) return `<h2 class="artigo-subtitulo">${b.titulo}</h2>`;
    if (b.lista) return `<ul class="artigo-lista">${b.lista.map(item => {
      const i = item.indexOf(": ");
      return i > 0 ? `<li><b>${item.slice(0, i + 1)}</b> ${item.slice(i + 2)}</li>` : `<li>${item}</li>`;
    }).join("")}</ul>`;
    if (b.video && n.video) { videoMostrado = true; return htmlVideo(n); }
    if (b.instagram) return htmlInstagram(b.instagram);
    return "";
  }).join("");
  return partes + (n.video && !videoMostrado ? htmlVideo(n) : "");
}

function renderNoticias() {
  NOTICIAS.sort((a, b) => b.data.localeCompare(a.data));
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
        ${htmlCorpo(n)}
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
