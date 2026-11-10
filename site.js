/* ===== CONFIGURAÇÃO (EDITAR AQUI) ===== */
const CONFIG = {
  nome: "USF Covelo",
  telefone: "22 557 4810",
  telefoneLink: "+351225574810",
  email: "usf.covelo@ulssjoao.min-saude.pt",
  // Cole aqui o link do Google Forms (ver instruções). Ao clicar no e-mail abre este formulário.
  formsUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdd0mE9YW1XXScdZXlky5ZgLWJHU4BGEmoLNpqNfzEsUyZNjw/viewform?usp=dialog",
  morada: "Rua Faria Guimarães, 915-931",
  codigoPostal: "4200 Porto",
  horario: "Segunda a sexta, 08h00 – 20h00"
};

/* ===== MENU (EDITAR AQUI: nome do separador e ficheiro) ===== */
const MENU = [
  ["Início", "index.html"],
  ["Quem Somos", "quem-somos.html"],
  ["Funcionamento", "funcionamento.html"],
  ["Área do Utente", "area-do-utente.html"],
  ["Informações Úteis", "informacoes-uteis.html"],
  ["Contactos", "contactos.html"]
];

/* Pequenos ícones (traço simples) */
const ICO = {
  tel: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  relogio: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  local: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  menu: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

const atual = location.pathname.split("/").pop() || "index.html";
const links = MENU.map(([n, f]) =>
  `<a href="${f}" class="${(f === atual) ? "ativo" : ""}">${n}</a>`).join("");

document.getElementById("cabecalho").innerHTML = `
<div class="topbar"><div class="wrap">
  <span class="so-largo">${ICO.relogio} ${CONFIG.horario}</span>
  <div class="grupo">
    <a href="tel:${CONFIG.telefoneLink}">${ICO.tel} ${CONFIG.telefone}</a>
    <a class="so-largo" href="${CONFIG.formsUrl}" target="_blank" rel="noopener">${ICO.mail} ${CONFIG.email}</a>
  </div>
</div></div>
<header class="site"><div class="wrap">
  <a class="brand" href="index.html">
    <img src="logo-usf-covelo.png" alt="Logótipo da USF Covelo" width="52" height="46">
    <span><b>${CONFIG.nome}</b><small>Unidade de Saúde Familiar · Porto</small></span>
  </a>
  <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="menu-principal">${ICO.menu} Menu</button>
  <nav class="menu" id="menu-principal">${links}<a href="entrar.html" id="conta-link" class="conta-btn">Entrar</a></nav>
</div></header>`;

/* Menu em telemóveis */
const botaoMenu = document.querySelector(".menu-toggle");
const menu = document.getElementById("menu-principal");
botaoMenu.addEventListener("click", () => {
  const aberto = menu.classList.toggle("aberto");
  botaoMenu.setAttribute("aria-expanded", aberto);
});

/* Carrega a área de conta (autenticação). Ver conta.js */
const scriptConta = document.createElement("script");
scriptConta.type = "module";
scriptConta.src = "conta.js";
document.body.appendChild(scriptConta);

document.getElementById("rodape").innerHTML = `
<div class="parceiros"><div class="wrap">
  <img src="logos-institucionais.png" alt="USF Covelo · ULS São João · Cuidados de Saúde Primários · República Portuguesa – Saúde · SNS – Serviço Nacional de Saúde">
</div></div>
<footer class="site"><div class="wrap">
  <div class="rod-grid">
    <div class="rod-marca">
      <img src="logo-usf-covelo.png" alt="">
      <div><b>${CONFIG.nome}</b>Unidade de Saúde Familiar da ULS São João, ao serviço da comunidade do Porto.</div>
    </div>
    <div>
      <h4>Contactos</h4>
      <p class="rod-linha">${ICO.tel}<a href="tel:${CONFIG.telefoneLink}">${CONFIG.telefone}</a></p>
      <p class="rod-linha">${ICO.mail}<a href="${CONFIG.formsUrl}" target="_blank" rel="noopener">Enviar mensagem</a></p>
      <p class="rod-linha">${ICO.local}<span>${CONFIG.morada}<br>${CONFIG.codigoPostal}</span></p>
    </div>
    <div>
      <h4>Horário</h4>
      <p>${CONFIG.horario}</p>
      <p>Sábados, domingos e feriados: encerrado</p>
    </div>
    <div>
      <h4>Navegação</h4>
      <ul>${MENU.map(([n, f]) => `<li><a href="${f}">${n}</a></li>`).join("")}</ul>
    </div>
  </div>
  <div class="rod-fim">
    <span>&copy; ${new Date().getFullYear()} ${CONFIG.nome}</span>
    <span>Emergência: <b>112</b> · SNS 24: <a href="tel:808242424"><b>808 24 24 24</b></a></span>
  </div>
</div></footer>`;

/* Liga todos os links de e-mail marcados com data-forms ao Google Forms */
document.querySelectorAll("a[data-forms]").forEach(a => {
  a.href = CONFIG.formsUrl; a.target = "_blank"; a.rel = "noopener";
});
