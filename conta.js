/* =====================================================================
   CONTA DO UTENTE — autenticação, criação de conta e perfil
   Usa Firebase (Authentication + Firestore) e EmailJS para o aviso por e-mail.
   Ver o ficheiro INSTRUCOES-AUTENTICACAO.md para configurar.
   ===================================================================== */

/* ===== CONFIGURAÇÃO =====
   Os códigos do Firebase e do EmailJS estão no ficheiro configuracao-conta.js */
import { AUTH_CONFIG } from "./configuracao-conta.js";

/* ===== EQUIPAS DE FAMÍLIA (EDITAR AQUI se a equipa mudar) =====
   Cada linha: [médico, enfermeiro, secretário clínico]. Deve corresponder à página Quem Somos. */
const EQUIPAS = [
  ["Dr.ª Alexandra Rabaçal", "Enf.ª Joana Carvalho", "S. C.ª Júlia Silva"],
  ["Dr.ª Andreia Ribeirinho", "Enf.ª Michele Pinto", "S. C. João Paulo"],
  ["Dr.ª Cláudia Conceição", "Enf.ª Carla Alves", "S. C.ª Clara Pereira"],
  ["Dr.ª Cristina Bacelar", "Enf.ª Mª João Amorim", "S. C.ª Júlia Silva"],
  ["Dr. Gonçalo Gomes Pereira", "Enf.ª Patrícia Santos", "S. C. Rui Lima"],
  ["Dr.ª Joana Moreira", "Enf.ª Joana Coelho", "S. C.ª Mónica Lia"],
  ["Dr.ª Ana Rodrigues", "Enf.ª Ana Morais", "S. C.ª Susana Sobral"],
  ["Dr.ª Patrícia Cadavez", "Enf.ª Patrícia Malhão", "S. C. Rui Lima"]
];

/* ===== A partir daqui não precisa de editar ===== */
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const configurado = !String(AUTH_CONFIG.firebase.apiKey).includes("COLE_AQUI");

let auth = null, db = null, fa = null, fs = null;

async function iniciarFirebase() {
  if (!configurado) return false;
  if (auth) return true;
  const [{ initializeApp }, fAuth, fStore] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-firestore.js")
  ]);
  fa = fAuth; fs = fStore;
  const app = initializeApp(AUTH_CONFIG.firebase);
  auth = fa.getAuth(app);
  auth.languageCode = "pt";
  db = fs.getFirestore(app);
  return true;
}

/* ---------- Validações ---------- */
const soDigitos = v => String(v || "").replace(/\D/g, "");

function normalizarTelemovel(v) {
  let d = soDigitos(v);
  if (d.startsWith("00351")) d = d.slice(5);
  else if (d.startsWith("351") && d.length === 12) d = d.slice(3);
  return d;
}
const telemovelValido = t => /^9[1236]\d{7}$/.test(t);
const utenteValido = n => /^\d{9}$/.test(n);
const codigoPostalValido = c => /^\d{4}-\d{3}$/.test(c);

function nifValido(nif) {
  if (!/^\d{9}$/.test(nif)) return false;
  let soma = 0;
  for (let i = 0; i < 8; i++) soma += Number(nif[i]) * (9 - i);
  let ctrl = 11 - (soma % 11);
  if (ctrl >= 10) ctrl = 0;
  return ctrl === Number(nif[8]);
}

/* ---------- Médico de família ---------- */
const medicoValido = m => m === "" || EQUIPAS.some(e => e[0] === m);

function preencherMedicos(select, atual) {
  if (!select) return;
  select.innerHTML = '<option value="">Não sei / ainda não tenho médico atribuído</option>' +
    EQUIPAS.map(([m]) => `<option value="${m}"${m === atual ? " selected" : ""}>${m}</option>`).join("");
}

/* No perfil: se o médico mais escolhido nos pedidos for diferente do indicado, sugere associá-lo */
function sugerirMedicoNoPerfil(form, perfil) {
  const caixa = document.getElementById("sugestao-medico");
  if (!caixa) return;
  const sugerido = medicoMaisEscolhido(perfil.historicoMedicos);
  if (!sugerido || sugerido === perfil.medicoFamilia) { caixa.hidden = true; return; }
  caixa.querySelector(".nome-sugerido").textContent = sugerido;
  caixa.hidden = false;
  caixa.querySelector("button").onclick = () => {
    form.medicoFamilia.value = sugerido;
    caixa.hidden = true;
    form.requestSubmit();
  };
}

function mostrarEquipa(medico) {
  const caixa = document.getElementById("perfil-equipa");
  if (!caixa) return;
  const eq = EQUIPAS.find(e => e[0] === medico);
  if (!eq) { caixa.hidden = true; return; }
  const papeis = ["Médico(a) de família", "Enfermeiro(a) de família", "Secretário(a) clínico(a)"];
  caixa.querySelector(".lista").innerHTML = eq.map((n, i) =>
    `<div class="membro"><span class="papel">${papeis[i]}</span><span>${n}</span></div>`).join("");
  caixa.hidden = false;
}

/* ---------- Mensagens de erro ---------- */
function mensagemErro(e) {
  const c = (e && e.code) || "";
  const m = {
    "auth/invalid-credential": "Dados de acesso incorretos.",
    "auth/wrong-password": "Dados de acesso incorretos.",
    "auth/user-not-found": "Dados de acesso incorretos.",
    "auth/invalid-email": "O e-mail não é válido.",
    "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
    "auth/weak-password": "A palavra-passe deve ter pelo menos 8 caracteres.",
    "auth/too-many-requests": "Demasiadas tentativas. Tente novamente daqui a alguns minutos.",
    "auth/network-request-failed": "Sem ligação à internet. Verifique a ligação e tente de novo.",
    "auth/requires-recent-login": "Por segurança, saia e volte a entrar antes de fazer esta alteração.",
    "permission-denied": "Não foi possível guardar os dados (permissão negada)."
  };
  if (m[c]) return m[c];
  if (e && e.message && !c) return e.message;
  console.error(e);
  return "Ocorreu um erro. Tente novamente.";
}

function mostrar(el, texto, tipo = "erro") {
  if (!el) return;
  el.textContent = texto;
  el.className = "msg " + tipo;
  el.hidden = !texto;
}

function avisoNaoConfigurado(form) {
  const aviso = document.createElement("div");
  aviso.className = "msg aviso-cfg";
  aviso.innerHTML = configurado
    ? "<b>Serviço temporariamente indisponível.</b> Verifique a ligação à internet e recarregue a página."
    : "<b>Área em configuração.</b> A autenticação ainda não está ligada. " +
      "Siga o ficheiro <code>INSTRUCOES-AUTENTICACAO.md</code> e cole os dados do Firebase em <code>conta.js</code>.";
  form.before(aviso);
  form.querySelectorAll("input,button,select,textarea").forEach(i => i.disabled = true);
}

function bloquear(form, sim, textoBotao) {
  const b = form.querySelector("button[type=submit]");
  if (!b) return;
  if (sim) { b.dataset.txt = b.textContent; b.textContent = textoBotao || "Aguarde…"; }
  else if (b.dataset.txt) b.textContent = b.dataset.txt;
  b.disabled = sim;
}

/* ---------- Identificadores (telemóvel / n.º de utente → e-mail) ---------- */
const idTel = t => "tel_" + t;
const idSns = n => "sns_" + n;

async function emailsPara(identificador) {
  const v = identificador.trim();
  if (v.includes("@")) return [v.toLowerCase()];
  const candidatos = [];
  const tel = normalizarTelemovel(v);
  const num = soDigitos(v);
  const ids = [];
  if (telemovelValido(tel)) ids.push(idTel(tel));
  if (utenteValido(num)) ids.push(idSns(num));
  for (const id of ids) {
    const s = await fs.getDoc(fs.doc(db, "identificadores", id));
    if (s.exists() && !candidatos.includes(s.data().email)) candidatos.push(s.data().email);
  }
  return candidatos;
}

/* ---------- Aviso por e-mail (EmailJS) ---------- */
async function enviarAvisoNovaConta(dados) {
  const ej = AUTH_CONFIG.emailjs;
  if (!ej.serviceId || !ej.templateId || !ej.publicKey) {
    console.warn("EmailJS não configurado: aviso de nova conta não enviado.");
    return;
  }
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: ej.serviceId,
        template_id: ej.templateId,
        user_id: ej.publicKey,
        template_params: {
          para: AUTH_CONFIG.emailNotificacao,
          nome: dados.nomeCompleto,
          email: dados.email,
          telemovel: dados.telemovel,
          numero_utente: dados.numeroUtente,
          medico: dados.medicoFamilia || "Não indicado",
          data: new Date().toLocaleString("pt-PT")
        }
      })
    });
  } catch (e) {
    console.warn("Falha ao enviar aviso de nova conta:", e);
  }
}

/* ---------- Cabeçalho: botão Entrar / O meu perfil ---------- */
function atualizarCabecalho(user) {
  const link = document.getElementById("conta-link");
  if (!link) return;
  if (user) {
    const primeiro = (user.displayName || "").split(" ")[0];
    link.textContent = primeiro ? "Olá, " + primeiro : "O meu perfil";
    link.href = "perfil.html";
  } else {
    link.textContent = "Entrar";
    link.href = "entrar.html";
  }
}

function destinoDepoisDeEntrar() {
  const p = new URLSearchParams(location.search).get("voltar");
  return p && /^[\w-]+\.html$/.test(p) ? p : "perfil.html";
}

/* ---------- Botão Chave Móvel Digital ---------- */
function ligarBotaoCMD() {
  const b = document.getElementById("btn-cmd");
  if (!b) return;
  b.addEventListener("click", () => {
    const cmd = AUTH_CONFIG.chaveMovelDigital;
    if (cmd.ativo && cmd.url) { location.href = cmd.url; return; }
    mostrar(document.getElementById("msg-cmd"),
      "A entrada com Chave Móvel Digital estará disponível brevemente. Por agora, utilize o e-mail, telemóvel ou n.º de utente.",
      "info");
  });
}

/* =====================================================================
   PÁGINA: ENTRAR
   ===================================================================== */
function paginaEntrar() {
  const form = document.getElementById("form-entrar");
  const msg = document.getElementById("msg-entrar");
  ligarBotaoCMD();
  if (!auth) return avisoNaoConfigurado(form);

  fa.onAuthStateChanged(auth, u => { if (u) location.replace(destinoDepoisDeEntrar()); });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    mostrar(msg, "");
    const ident = form.identificador.value;
    const pw = form.password.value;
    if (!ident.trim() || !pw) return mostrar(msg, "Preencha todos os campos.");
    bloquear(form, true, "A entrar…");
    try {
      const emails = await emailsPara(ident);
      if (!emails.length) throw { code: "auth/invalid-credential" };
      let ultimoErro;
      for (const email of emails) {
        try { await fa.signInWithEmailAndPassword(auth, email, pw); return; }
        catch (e) { ultimoErro = e; }
      }
      throw ultimoErro;
    } catch (e) {
      mostrar(msg, mensagemErro(e));
      bloquear(form, false);
    }
  });

  document.getElementById("link-recuperar").addEventListener("click", async ev => {
    ev.preventDefault();
    const ident = form.identificador.value;
    if (!ident.trim()) return mostrar(msg, "Escreva primeiro o seu e-mail, telemóvel ou n.º de utente no campo acima.");
    try {
      const emails = await emailsPara(ident);
      for (const email of emails) await fa.sendPasswordResetEmail(auth, email).catch(() => {});
    } catch (_) { /* não revelar se a conta existe */ }
    mostrar(msg, "Se existir uma conta associada, enviámos um e-mail com instruções para redefinir a palavra-passe.", "ok");
  });
}

/* =====================================================================
   PÁGINA: CRIAR CONTA
   ===================================================================== */
function lerDadosFormulario(form) {
  return {
    nomeCompleto: form.nomeCompleto.value.trim().replace(/\s+/g, " "),
    numeroUtente: form.numeroUtente ? soDigitos(form.numeroUtente.value) : "",
    telemovel: normalizarTelemovel(form.telemovel.value),
    morada: form.morada.value.trim(),
    codigoPostal: form.codigoPostal.value.trim(),
    localidade: form.localidade.value.trim(),
    nif: soDigitos(form.nif.value),
    medicoFamilia: form.medicoFamilia ? form.medicoFamilia.value : ""
  };
}

function validarDados(d) {
  if (d.nomeCompleto.split(" ").length < 2) return "Indique o nome completo (nome e apelido).";
  if (!utenteValido(d.numeroUtente)) return "O n.º de utente deve ter 9 dígitos.";
  if (!telemovelValido(d.telemovel)) return "Indique um número de telemóvel português válido (9 dígitos, começado por 91, 92, 93 ou 96).";
  if (!d.morada) return "Indique a morada.";
  if (!codigoPostalValido(d.codigoPostal)) return "O código postal deve ter o formato 0000-000.";
  if (!d.localidade) return "Indique a localidade.";
  if (d.nif && !nifValido(d.nif)) return "O NIF indicado não é válido.";
  if (!medicoValido(d.medicoFamilia)) return "Escolha um médico de família da lista.";
  return "";
}

function paginaRegistar() {
  const form = document.getElementById("form-registar");
  const msg = document.getElementById("msg-registar");
  ligarBotaoCMD();
  preencherMedicos(form.medicoFamilia, "");
  if (!auth) return avisoNaoConfigurado(form);

  let aCriar = false;
  fa.onAuthStateChanged(auth, u => { if (u && !aCriar) location.replace("perfil.html"); });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    mostrar(msg, "");
    const d = lerDadosFormulario(form);
    const email = form.email.value.trim().toLowerCase();
    const pw = form.password.value;
    const pw2 = form.password2.value;

    const erro = validarDados(d) ||
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Indique um e-mail válido." : "") ||
      (pw.length < 8 ? "A palavra-passe deve ter pelo menos 8 caracteres." : "") ||
      (pw !== pw2 ? "As palavras-passe não coincidem." : "") ||
      (!form.consentimento.checked ? "Para criar conta tem de autorizar o tratamento dos seus dados." : "");
    if (erro) return mostrar(msg, erro);

    bloquear(form, true, "A criar conta…");
    aCriar = true;
    let cred = null;
    try {
      const [snsDoc, telDoc] = await Promise.all([
        fs.getDoc(fs.doc(db, "identificadores", idSns(d.numeroUtente))),
        fs.getDoc(fs.doc(db, "identificadores", idTel(d.telemovel)))
      ]);
      if (snsDoc.exists()) throw new Error("Já existe uma conta com este n.º de utente. Se não foi o próprio a criá-la, contacte a USF.");
      if (telDoc.exists()) throw new Error("Já existe uma conta com este número de telemóvel.");

      cred = await fa.createUserWithEmailAndPassword(auth, email, pw);
      const uid = cred.user.uid;
      await fa.updateProfile(cred.user, { displayName: d.nomeCompleto });

      const lote = fs.writeBatch(db);
      lote.set(fs.doc(db, "utentes", uid), {
        ...d, email, medicoAtualizadoEm: fs.serverTimestamp(),
        criadoEm: fs.serverTimestamp(), atualizadoEm: fs.serverTimestamp()
      });
      lote.set(fs.doc(db, "identificadores", idSns(d.numeroUtente)), { uid, email });
      lote.set(fs.doc(db, "identificadores", idTel(d.telemovel)), { uid, email });
      await lote.commit();

      await enviarAvisoNovaConta({ ...d, email });
      location.replace("perfil.html?nova=1");
    } catch (e) {
      // Se a conta foi criada mas os dados não foram guardados, desfaz para não ficar uma conta "vazia"
      if (cred) await fa.deleteUser(cred.user).catch(() => {});
      aCriar = false;
      mostrar(msg, mensagemErro(e));
      bloquear(form, false);
    }
  });
}

/* =====================================================================
   PÁGINA: PERFIL
   ===================================================================== */
function paginaPerfil() {
  const form = document.getElementById("form-perfil");
  const msg = document.getElementById("msg-perfil");
  if (!auth) return avisoNaoConfigurado(form);

  if (new URLSearchParams(location.search).get("nova"))
    mostrar(msg, "Conta criada com sucesso. Bem-vindo(a) à área pessoal da USF Covelo.", "ok");

  let atual = null, uid = null;

  fa.onAuthStateChanged(auth, async u => {
    if (!u) return location.replace("entrar.html?voltar=perfil.html");
    uid = u.uid;
    try {
      const s = await fs.getDoc(fs.doc(db, "utentes", uid));
      if (!s.exists()) return mostrar(msg, "Não encontrámos os dados do seu perfil. Contacte a USF.");
      atual = s.data();
      document.getElementById("perfil-nome").textContent = atual.nomeCompleto;
      document.getElementById("perfil-email").textContent = atual.email;
      document.getElementById("perfil-utente").textContent = atual.numeroUtente;
      for (const c of ["nomeCompleto", "telemovel", "morada", "codigoPostal", "localidade", "nif"])
        form[c].value = atual[c] || "";
      preencherMedicos(form.medicoFamilia, atual.medicoFamilia || "");
      mostrarEquipa(atual.medicoFamilia || "");
      sugerirMedicoNoPerfil(form, atual);
      document.getElementById("perfil-conteudo").hidden = false;
      document.getElementById("perfil-carregar").hidden = true;
    } catch (e) { mostrar(msg, mensagemErro(e)); }
  });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    mostrar(msg, "");
    if (!atual) return;
    const d = { ...lerDadosFormulario(form), numeroUtente: atual.numeroUtente };
    const erro = validarDados(d);
    if (erro) return mostrar(msg, erro);
    bloquear(form, true, "A guardar…");
    try {
      const lote = fs.writeBatch(db);
      if (d.telemovel !== atual.telemovel) {
        const t = await fs.getDoc(fs.doc(db, "identificadores", idTel(d.telemovel)));
        if (t.exists()) throw new Error("Esse número de telemóvel já está associado a outra conta.");
        lote.delete(fs.doc(db, "identificadores", idTel(atual.telemovel)));
        lote.set(fs.doc(db, "identificadores", idTel(d.telemovel)), { uid, email: atual.email });
      }
      const alterado = {
        nomeCompleto: d.nomeCompleto, telemovel: d.telemovel, morada: d.morada,
        codigoPostal: d.codigoPostal, localidade: d.localidade, nif: d.nif,
        medicoFamilia: d.medicoFamilia,
        atualizadoEm: fs.serverTimestamp()
      };
      // Guarda sempre a escolha mais recente do médico de família, com a data da alteração
      if (d.medicoFamilia !== (atual.medicoFamilia || "")) alterado.medicoAtualizadoEm = fs.serverTimestamp();
      lote.update(fs.doc(db, "utentes", uid), alterado);
      await lote.commit();
      if (d.nomeCompleto !== atual.nomeCompleto) await fa.updateProfile(auth.currentUser, { displayName: d.nomeCompleto });
      atual = { ...atual, ...alterado };
      document.getElementById("perfil-nome").textContent = d.nomeCompleto;
      mostrarEquipa(d.medicoFamilia);
      atualizarCabecalho(auth.currentUser);
      mostrar(msg, "Dados atualizados.", "ok");
    } catch (e) { mostrar(msg, mensagemErro(e)); }
    bloquear(form, false);
  });

  document.getElementById("btn-sair").addEventListener("click", () => fa.signOut(auth));
}

/* =====================================================================
   PÁGINAS: PEDIDO DE MARCAÇÃO DE CONSULTA E DE RENOVAÇÃO DE RECEITUÁRIO
   O pedido é enviado por e-mail (EmailJS) para AUTH_CONFIG.emailPedidos.
   ===================================================================== */
const SEM_MEDICO = "Não tenho médico de família";
const NAO_SEI_MEDICO = "Não sei o nome do meu médico de família";
const MAX_MEDICAMENTOS = 10;
const ESPERA_ENTRE_PEDIDOS = 60 * 1000; // 1 minuto, para evitar envios repetidos

const escapar = v => String(v ?? "").replace(/[&<>"']/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function opcoesMedico(select) {
  select.innerHTML =
    '<option value="" disabled selected>Escolha uma opção</option>' +
    '<optgroup label="Médicos de família da USF Covelo">' +
    EQUIPAS.map(([m]) => `<option value="${m}">${m}</option>`).join("") + "</optgroup>" +
    `<optgroup label="Outras opções"><option value="${SEM_MEDICO}">${SEM_MEDICO}</option><option value="${NAO_SEI_MEDICO}">${NAO_SEI_MEDICO}</option></optgroup>`;
}

async function enviarEmail(templateId, params) {
  const ej = AUTH_CONFIG.emailjs;
  const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_id: ej.serviceId, template_id: templateId, user_id: ej.publicKey, template_params: params })
  });
  if (!r.ok) {
    const detalhe = (await r.text().catch(() => "")).slice(0, 200);
    const e = new Error("EmailJS " + r.status + (detalhe ? " – " + detalhe : ""));
    e.emailjs = true;
    throw e;
  }
}

/* Tabela HTML organizada que vai no corpo do e-mail */
function tabelaEmail(titulo, linhas, medicamentos) {
  const td = 'style="padding:8px 12px;border-bottom:1px solid #e7e2d7;vertical-align:top"';
  const th = 'style="padding:8px 12px;border-bottom:1px solid #e7e2d7;text-align:left;color:#5a6070;font-weight:600;white-space:nowrap;vertical-align:top"';
  let h = `<h2 style="font-family:Georgia,serif;color:#16235e;margin:0 0 12px">${escapar(titulo)}</h2>` +
    `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;min-width:420px">` +
    linhas.map(([k, v]) => `<tr><th ${th}>${escapar(k)}</th><td ${td}>${escapar(v)}</td></tr>`).join("") + "</table>";
  if (medicamentos && medicamentos.length) {
    h += `<h3 style="font-family:Georgia,serif;color:#16235e;margin:22px 0 8px">Medicação a renovar</h3>` +
      `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;min-width:420px">` +
      `<tr><th ${th}>#</th><th ${th}>Medicamento</th><th ${th}>Dosagem</th><th ${th}>Quantidade</th></tr>` +
      medicamentos.map((m, i) => `<tr><td ${td}>${i + 1}</td><td ${td}>${escapar(m.nome)}</td><td ${td}>${escapar(m.dosagem)}</td><td ${td}>${escapar(m.quantidade)}</td></tr>`).join("") +
      "</table>";
  }
  return h;
}

/* Versão em texto simples (para o resumo e para o modelo sem HTML) */
function textoEmail(titulo, linhas, medicamentos) {
  let t = titulo + "\n\n" + linhas.map(([k, v]) => `${k}: ${v}`).join("\n");
  if (medicamentos && medicamentos.length)
    t += "\n\nMedicação a renovar:\n" + medicamentos.map((m, i) => `${i + 1}. ${m.nome} — ${m.dosagem} — quantidade: ${m.quantidade}`).join("\n");
  return t;
}

function linhaMedicamento(n) {
  const d = document.createElement("div");
  d.className = "medicamento";
  d.innerHTML = `
    <div class="medicamento-cab"><b>Medicamento ${n}</b>${n > 1 ? '<button type="button" class="remover">Remover</button>' : ""}</div>
    <div class="tres">
      <label>Nome do medicamento *<input name="med_nome" required placeholder="Ex.: Metformina"></label>
      <label>Dosagem *<input name="med_dosagem" required placeholder="Ex.: 500 mg"></label>
      <label>Quantidade *<input name="med_quantidade" required placeholder="Ex.: 2 embalagens"></label>
    </div>`;
  return d;
}

function renumerarMedicamentos(lista) {
  lista.querySelectorAll(".medicamento").forEach((m, i) => m.querySelector(".medicamento-cab b").textContent = "Medicamento " + (i + 1));
}

/* ---------- Médico recomendado ----------
   Guarda os médicos escolhidos nos últimos pedidos (até 20) e recomenda o
   mais escolhido; em caso de empate, o escolhido mais recentemente.
   Sem pedidos anteriores, usa o médico de família indicado no perfil. */
const MAX_HISTORICO = 20;
const eMedicoDaUSF = m => EQUIPAS.some(e => e[0] === m);

function medicoMaisEscolhido(historico) {
  const lista = (Array.isArray(historico) ? historico : []).filter(eMedicoDaUSF);
  if (!lista.length) return "";
  const conta = {};
  lista.forEach((m, i) => { conta[m] = conta[m] || { n: 0, ultimo: 0 }; conta[m].n++; conta[m].ultimo = i; });
  return Object.entries(conta).sort((a, b) => b[1].n - a[1].n || b[1].ultimo - a[1].ultimo)[0][0];
}

function medicoRecomendado(perfil) {
  const doHistorico = medicoMaisEscolhido(perfil.historicoMedicos);
  if (doHistorico) return { medico: doHistorico, origem: "historico" };
  if (eMedicoDaUSF(perfil.medicoFamilia)) return { medico: perfil.medicoFamilia, origem: "perfil" };
  return { medico: "", origem: "" };
}

async function registarMedicoNoHistorico(uid, medico) {
  if (!uid || !eMedicoDaUSF(medico)) return;
  try {
    const ref = fs.doc(db, "utentes", uid);
    const s = await fs.getDoc(ref);
    if (!s.exists()) return;
    const hist = (s.data().historicoMedicos || []).concat(medico).slice(-MAX_HISTORICO);
    await fs.updateDoc(ref, { historicoMedicos: hist });
  } catch (e) { console.warn("Não foi possível guardar o médico escolhido:", e); }
}

async function preencherComPerfil(form) {
  if (!auth) return;
  const u = await new Promise(res => { const off = fa.onAuthStateChanged(auth, x => { off(); res(x); }); });
  if (!u) return;
  try {
    const s = await fs.getDoc(fs.doc(db, "utentes", u.uid));
    if (!s.exists()) return;
    const p = s.data();
    if (!form.nome.value) form.nome.value = p.nomeCompleto || "";
    if (!form.numeroUtente.value) form.numeroUtente.value = p.numeroUtente || "";
    const rec = medicoRecomendado(p);
    if (rec.medico && !form.medicoFamilia.value) {
      form.medicoFamilia.value = rec.medico;
      const notaMedico = document.getElementById("nota-medico");
      if (notaMedico) {
        notaMedico.textContent = rec.origem === "historico"
          ? "Sugerido: é o médico que escolheu mais vezes nos seus pedidos anteriores."
          : "Sugerido: é o médico de família indicado no seu perfil.";
        notaMedico.hidden = false;
      }
    }
    form.dataset.email = p.email || "";
    form.dataset.uid = u.uid;
    const nota = document.getElementById("nota-sessao");
    if (nota) nota.hidden = false;
  } catch (_) { /* sem dados do perfil: o utente preenche à mão */ }
}

function paginaPedido(pagina) {
  const receituario = pagina === "pedido-receituario";
  const form = document.getElementById("form-pedido");
  const msg = document.getElementById("msg-pedido");
  const ej = AUTH_CONFIG.emailjs;
  opcoesMedico(form.medicoFamilia);

  if (!ej.serviceId || !ej.publicKey || !ej.templatePedidos) {
    const aviso = document.createElement("div");
    aviso.className = "msg aviso-cfg";
    aviso.innerHTML = "<b>Formulário em configuração.</b> Por agora, faça o pedido por telefone: <a href=\"tel:+351225574810\">22 557 4810</a>.";
    form.before(aviso);
    form.querySelectorAll("input,button,select").forEach(i => i.disabled = true);
    return;
  }

  // Lista de medicamentos (só no receituário)
  const lista = document.getElementById("lista-medicamentos");
  const botaoMais = document.getElementById("mais-medicamento");
  if (receituario) {
    lista.appendChild(linhaMedicamento(1));
    botaoMais.addEventListener("click", () => {
      const n = lista.querySelectorAll(".medicamento").length;
      if (n >= MAX_MEDICAMENTOS) return mostrar(msg, `Pode pedir até ${MAX_MEDICAMENTOS} medicamentos de cada vez.`);
      const nova = linhaMedicamento(n + 1);
      lista.appendChild(nova);
      nova.querySelector("input").focus();
    });
    lista.addEventListener("click", ev => {
      if (!ev.target.classList.contains("remover")) return;
      ev.target.closest(".medicamento").remove();
      renumerarMedicamentos(lista);
    });
  }

  // N.º de utente: aceita só algarismos e no máximo 9 (espaços ou outros caracteres colados são retirados)
  form.numeroUtente.addEventListener("input", () => {
    const limpo = soDigitos(form.numeroUtente.value).slice(0, 9);
    if (form.numeroUtente.value !== limpo) form.numeroUtente.value = limpo;
  });

  preencherComPerfil(form);

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    mostrar(msg, "");
    if (form.website.value) return; // campo escondido: só os robôs o preenchem

    const nome = form.nome.value.trim().replace(/\s+/g, " ");
    const numeroUtente = soDigitos(form.numeroUtente.value);
    const medico = form.medicoFamilia.value;
    let medicamentos = [];
    if (receituario) {
      medicamentos = [...lista.querySelectorAll(".medicamento")].map(m => ({
        nome: m.querySelector('[name="med_nome"]').value.trim(),
        dosagem: m.querySelector('[name="med_dosagem"]').value.trim(),
        quantidade: m.querySelector('[name="med_quantidade"]').value.trim()
      }));
    }

    let erro = "";
    if (nome.split(" ").length < 2) erro = "Indique o nome completo (nome e apelido).";
    else if (!utenteValido(numeroUtente)) erro = "O n.º de utente deve ter exatamente 9 dígitos.";
    else if (!medico) erro = "Escolha o seu médico de família (ou uma das outras opções).";
    else if (receituario && !medicamentos.length) erro = "Indique pelo menos um medicamento.";
    else if (receituario) {
      const i = medicamentos.findIndex(m => !m.nome || !m.dosagem || !m.quantidade);
      if (i >= 0) erro = `Preencha o nome, a dosagem e a quantidade do medicamento ${i + 1}.`;
    }
    if (erro) return mostrar(msg, erro);

    const chave = "ultimoPedido_" + pagina;
    let ultimo = 0;
    try { ultimo = Number(localStorage.getItem(chave)) || 0; } catch (_) {}
    if (Date.now() - ultimo < ESPERA_ENTRE_PEDIDOS)
      return mostrar(msg, "Acabou de enviar um pedido. Aguarde um minuto antes de enviar outro.");

    const titulo = receituario ? "Pedido de renovação de receituário" : "Pedido de marcação de consulta";
    const data = new Date().toLocaleString("pt-PT");
    const linhas = [
      ["Nome", nome],
      ["N.º de utente", numeroUtente],
      ["Médico de família", medico],
      ["Data do pedido", data]
    ];
    if (form.dataset.email) linhas.push(["Conta no site", form.dataset.email]);

    bloquear(form, true, "A enviar…");
    try {
      await enviarEmail(ej.templatePedidos, {
        para: AUTH_CONFIG.emailPedidos,
        assunto: `${titulo} — ${nome}`,
        tipo: titulo,
        nome, numero_utente: numeroUtente, medico, data,
        medicamentos: medicamentos.map((m, i) => `${i + 1}. ${m.nome} — ${m.dosagem} — ${m.quantidade}`).join("\n"),
        mensagem_html: tabelaEmail(titulo, linhas, medicamentos),
        mensagem: textoEmail(titulo, linhas, medicamentos)
      });
      try { localStorage.setItem(chave, String(Date.now())); } catch (_) {}
      await registarMedicoNoHistorico(form.dataset.uid, medico);
      document.getElementById("pedido-enviado").hidden = false;
      document.getElementById("pedido-resumo").textContent = textoEmail(titulo, linhas.filter(l => l[0] !== "Conta no site"), medicamentos);
      form.hidden = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      mostrar(msg, "Não foi possível enviar o pedido. Tente de novo dentro de momentos ou ligue para o 22 557 4810." +
        "\n\nDetalhe técnico: " + (e.emailjs ? e.message : "sem resposta do serviço de e-mail (" + e.message + ")"));
    }
    bloquear(form, false);
  });

  document.getElementById("novo-pedido").addEventListener("click", () => location.reload());
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
(async () => {
  try { await iniciarFirebase(); }
  catch (e) { console.error("Não foi possível carregar o Firebase:", e); }

  if (auth) fa.onAuthStateChanged(auth, atualizarCabecalho);

  const pagina = document.body.dataset.pagina;
  if (pagina === "entrar") paginaEntrar();
  else if (pagina === "registar") paginaRegistar();
  else if (pagina === "perfil") paginaPerfil();
  else if (pagina === "pedido-consulta" || pagina === "pedido-receituario") paginaPedido(pagina);
})();
