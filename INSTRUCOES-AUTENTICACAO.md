# Autenticação de utentes — como pôr a funcionar

O site é composto por páginas estáticas, por isso as contas ficam guardadas num serviço externo gratuito, o **Firebase** (Google). O aviso por e-mail de cada nova conta é enviado através do **EmailJS**. Todos os dados a preencher estão no topo do ficheiro `conta.js`.

Ficheiros novos: `entrar.html`, `registar.html`, `perfil.html`, `conta.js`, `firestore.rules`.

---

## 1. Criar o projeto Firebase (≈10 min)

1. Abra https://console.firebase.google.com e clique em **Criar projeto** (ex.: `usf-covelo`). Pode desativar o Google Analytics.
2. **Authentication** → *Começar* → separador *Método de início de sessão* → ative **E-mail/palavra-passe**.
3. **Authentication** → *Definições* → *Domínios autorizados* → adicione o domínio onde o site vai estar (ex.: `usfcovelo.pt` ou `utilizador.github.io`). `localhost` já vem incluído.
4. **Firestore Database** → *Criar base de dados* → localização **europe-west** (dados na UE, importante para o RGPD) → modo de produção.
5. Em **Firestore → Regras**, apague o que lá está, cole o conteúdo do ficheiro `firestore.rules` e clique em **Publicar**.
6. **Definições do projeto** (roda dentada) → *As suas apps* → ícone **Web `</>`** → registe a app. Copie `apiKey`, `authDomain`, `projectId` e `appId` para o bloco `firebase` em `conta.js`.

> A `apiKey` do Firebase não é secreta — pode estar no site. Quem protege os dados são as regras do passo 5.

## 2. Aviso por e-mail de nova conta (EmailJS, ≈5 min)

1. Crie conta em https://www.emailjs.com (plano gratuito: 200 e-mails/mês).
2. *Email Services* → *Add New Service* → Gmail → ligue a conta que vai **enviar** os avisos. Copie o **Service ID**.
3. *Email Templates* → *Create New Template*:
   - **To Email:** `{{para}}`
   - **Subject:** `Nova conta criada no site — {{nome}}`
   - **Content:**
     ```
     Foi criada uma nova conta de utente em {{data}}.

     Nome: {{nome}}
     N.º de utente: {{numero_utente}}
     Telemóvel: {{telemovel}}
     E-mail: {{email}}
     ```
   Guarde e copie o **Template ID**.
4. *Account* → copie a **Public Key**.
5. Cole os três valores no bloco `emailjs` em `conta.js`. O destinatário (`carolinaapinto2006@gmail.com`) está em `emailNotificacao`.
6. Recomendado: em *Account → Security*, limite os pedidos ao domínio do site.

Por proteção de dados, o e-mail **não inclui** a morada nem o NIF; esses ficam só na base de dados (Firebase → Firestore → coleção `utentes`).

## 3. Testar no computador

Os módulos de JavaScript e o Firebase **não funcionam ao abrir o ficheiro com duplo clique** (`file://`). Abra um terminal nesta pasta e execute:

```
python3 -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## 4. Chave Móvel Digital

O botão já existe nas páginas *Entrar* e *Criar conta*, mas mostra "disponível brevemente". A CMD só pode ser usada por entidades que **aderiram ao Autenticação.gov** junto da **AMA – Agência para a Modernização Administrativa**:

- O pedido tem de ser feito pela entidade responsável (normalmente a ULS São João, não a USF isoladamente), com protocolo assinado.
- Exige um servidor próprio (a ligação usa SAML/OAuth com certificados) — não funciona apenas com páginas estáticas e Firebase.
- Informação: https://www.autenticacao.gov.pt → *Fornecedores de serviços*.

Quando houver um endereço de entrada fornecido pela integração, basta colocar em `conta.js`:
```js
chaveMovelDigital: { ativo: true, url: "https://…" }
```

## 5. Notas de proteção de dados (RGPD)

- Os dados ficam no Firebase (Google Cloud, UE se escolheu `europe-west`). A ULS/USF, como responsável pelo tratamento, deve validar esta solução com o seu **Encarregado de Proteção de Dados**.
- O registo pede consentimento explícito. Convém criar uma página de **Política de Privacidade** e ligá-la a partir desse texto.
- Pedidos de eliminação de conta: apagar o utilizador em *Authentication* e os documentos em `utentes` e `identificadores` na consola Firebase.
- Quem souber o telemóvel ou o n.º de utente de alguém consegue descobrir o e-mail associado (necessário para o início de sessão sem servidor). Para eliminar este ponto é preciso um pequeno servidor (Firebase Cloud Functions, plano Blaze).
