/* ===== CONFIGURAÇÃO (EDITAR AQUI) ===== */
const CONFIG = {
  nome: "USF Covelo",
  telefone: "22 557 4810",
  telefoneLink: "+351225574810",
  email: "usf.covelo@ulssjoao.min-saude.pt",
  // Cole aqui o link do Google Forms (ver instruções). Ao clicar no e-mail abre este formulário.
  formsUrl: "COLE_AQUI_O_LINK_DO_GOOGLE_FORMS",
  morada: "Rua Faria Guimarães, 915-931, 4200 Porto"
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

const atual = location.pathname.split("/").pop() || "index.html";
const links = MENU.map(([n, f]) =>
  `<a href="${f}" class="${(f === atual) ? "ativo" : ""}">${n}</a>`).join("");

document.getElementById("cabecalho").innerHTML = `
<div class="topbar"><div class="wrap">
  <a href="tel:${CONFIG.telefoneLink}">📞 ${CONFIG.telefone}</a>
  <a href="${CONFIG.formsUrl}" target="_blank" rel="noopener">✉️ ${CONFIG.email}</a>
</div></div>
<header class="site"><div class="wrap">
  <a class="brand" href="index.html"><span class="cruz"></span><span><b>${CONFIG.nome}</b><small>Unidade de Saúde Familiar · Porto</small></span></a>
  <nav class="menu">${links}</nav>
</div></header>`;

document.getElementById("rodape").innerHTML = `
<footer class="site"><div class="wrap">
  <div><b>${CONFIG.nome}</b><br>${CONFIG.morada}</div>
  <div>📞 <a href="tel:${CONFIG.telefoneLink}">${CONFIG.telefone}</a><br>
  ✉️ <a href="${CONFIG.formsUrl}" target="_blank" rel="noopener">${CONFIG.email}</a></div>
  <div>&copy; ${new Date().getFullYear()} ${CONFIG.nome}</div>
</div></footer>`;

/* Liga todos os links de e-mail marcados com data-forms ao Google Forms */
document.querySelectorAll("a[data-forms]").forEach(a => {
  a.href = CONFIG.formsUrl; a.target = "_blank"; a.rel = "noopener";
});
