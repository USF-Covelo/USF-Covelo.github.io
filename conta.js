/* =====================================================================
   CONTA DO UTENTE — autenticação, criação de conta e perfil
   Usa Firebase (Authentication + Firestore) e EmailJS para o aviso por e-mail.
   Ver o ficheiro INSTRUCOES-AUTENTICACAO.md para configurar.
   ===================================================================== */

/* ===== CONFIGURAÇÃO (EDITAR AQUI) ===== */
const AUTH_CONFIG = {
  // Cole aqui os dados do projeto Firebase (Consola Firebase → Definições do projeto → As suas apps → Web)
  firebase: {
    apiKey: "COLE_AQUI",
    authDomain: "COLE_AQUI.firebaseapp.com",
    projectId: "COLE_AQUI",
    appId: "COLE_AQUI"
  },
  // Dados da conta EmailJS (https://www.emailjs.com) para o aviso de nova conta
  emailjs: {
    serviceId: "",
    templateId: "",
    publicKey: ""
  },
  // Para onde vai o aviso sempre que alguém cria conta
  emailNotificacao: "carolinaapinto2006@gmail.com",
  // Chave Móvel Digital: só funciona depois de a ULS aderir ao Autenticação.gov (ver instruções)
  chaveMovelDigital: {
    ativo: false,
    url: ""
  }
};

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
    nif: soDigitos(form.nif.value)
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
  return "";
}

function paginaRegistar() {
  const form = document.getElementById("form-registar");
  const msg = document.getElementById("msg-registar");
  ligarBotaoCMD();
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
        ...d, email, criadoEm: fs.serverTimestamp(), atualizadoEm: fs.serverTimestamp()
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
        atualizadoEm: fs.serverTimestamp()
      };
      lote.update(fs.doc(db, "utentes", uid), alterado);
      await lote.commit();
      if (d.nomeCompleto !== atual.nomeCompleto) await fa.updateProfile(auth.currentUser, { displayName: d.nomeCompleto });
      atual = { ...atual, ...alterado };
      document.getElementById("perfil-nome").textContent = d.nomeCompleto;
      atualizarCabecalho(auth.currentUser);
      mostrar(msg, "Dados atualizados.", "ok");
    } catch (e) { mostrar(msg, mensagemErro(e)); }
    bloquear(form, false);
  });

  document.getElementById("btn-sair").addEventListener("click", () => fa.signOut(auth));
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
})();
