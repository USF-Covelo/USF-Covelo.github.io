# Autenticação de utentes — como pôr a funcionar

O site é composto por páginas estáticas, por isso as contas ficam guardadas num serviço externo gratuito, o **Firebase** (Google). O aviso por e-mail de cada nova conta é enviado através do **EmailJS**. Todos os códigos a preencher estão no ficheiro `configuracao-conta.js` (assim não se perdem quando o `conta.js` for atualizado).

Ficheiros novos: `entrar.html`, `registar.html`, `perfil.html`, `conta.js`, `configuracao-conta.js`, `firestore.rules`, `marcar-consulta.html`, `renovar-receituario.html`.

---

## 1. Criar o projeto Firebase (≈10 min)

1. Abra https://console.firebase.google.com e clique em **Criar projeto** (ex.: `usf-covelo`). Pode desativar o Google Analytics.
2. **Authentication** → *Começar* → separador *Método de início de sessão* → ative **E-mail/palavra-passe**.
3. **Authentication** → *Definições* → *Domínios autorizados* → adicione o domínio onde o site vai estar (ex.: `usfcovelo.pt` ou `utilizador.github.io`). `localhost` já vem incluído.
4. **Firestore Database** → *Criar base de dados* → localização **europe-west** (dados na UE, importante para o RGPD) → modo de produção.
5. Em **Firestore → Regras**, apague o que lá está, cole o conteúdo do ficheiro `firestore.rules` e clique em **Publicar**.
6. **Definições do projeto** (roda dentada) → *As suas apps* → ícone **Web `</>`** → registe a app. Copie `apiKey`, `authDomain`, `projectId` e `appId` para o bloco `firebase` em `configuracao-conta.js`.

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
     Médico de família: {{medico}}
     E-mail: {{email}}
     ```
   Guarde e copie o **Template ID**.
4. *Account* → copie a **Public Key**.
5. Cole os três valores no bloco `emailjs` em `configuracao-conta.js` (`serviceId`, `templateId` e `publicKey`). O destinatário (`carolinaapinto2006@gmail.com`) está em `emailNotificacao`.
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

Quando houver um endereço de entrada fornecido pela integração, basta colocar em `configuracao-conta.js`:
```js
chaveMovelDigital: { ativo: true, url: "https://…" }
```

## 5. Notas de proteção de dados (RGPD)

- Os dados ficam no Firebase (Google Cloud, UE se escolheu `europe-west`). A ULS/USF, como responsável pelo tratamento, deve validar esta solução com o seu **Encarregado de Proteção de Dados**.
- O registo pede consentimento explícito. Convém criar uma página de **Política de Privacidade** e ligá-la a partir desse texto.
- Pedidos de eliminação de conta: apagar o utilizador em *Authentication* e os documentos em `utentes` e `identificadores` na consola Firebase.
- Quem souber o telemóvel ou o n.º de utente de alguém consegue descobrir o e-mail associado (necessário para o início de sessão sem servidor). Para eliminar este ponto é preciso um pequeno servidor (Firebase Cloud Functions, plano Blaze).

## 6. Médico de família e formulários pré-preenchidos

- Na criação de conta e no perfil, o utente escolhe o seu **médico de família** (fica guardada a escolha mais recente). No perfil aparece a equipa completa (médico, enfermeiro e secretário clínico).
- A lista de equipas está no topo de `conta.js` (`EQUIPAS`). Se a equipa mudar, altere lá e na página `quem-somos.html`.
- As regras do Firestore foram atualizadas para aceitar este campo: **volte a colar `firestore.rules` em Firestore → Regras e clique em Publicar.**

## 7. Pedidos de marcação de consulta e de renovação de receituário

As páginas `marcar-consulta.html` e `renovar-receituario.html` têm os formulários dentro do próprio site. Cada pedido é enviado por e-mail para o endereço em `emailPedidos` (em `configuracao-conta.js`), com os dados organizados numa tabela. Se o utente tiver sessão iniciada, o nome, o n.º de utente e o médico de família já aparecem preenchidos.

Para funcionar, crie **um segundo modelo** no EmailJS (serve para os dois tipos de pedido):

1. *Email Templates* → *Create New Template*:
   - **To Email:** `{{para}}`
   - **Subject:** `{{assunto}}`
   - **Content:** clique em **Edit Content → Code Editor** e escreva só isto (com **três** chavetas):
     ```
     {{{mensagem_html}}}
     ```
   - Guarde e copie o **Template ID**.
2. Cole-o em `configuracao-conta.js`, no campo `templatePedidos`.
3. Faça um pedido de teste em cada página e confirme que o e-mail chega.

Enquanto `templatePedidos` estiver vazio, as páginas mostram "Formulário em configuração" e indicam o telefone.

Notas:
- O plano gratuito do EmailJS tem um limite de e-mails por mês (avisos de conta + pedidos). Se a USF começar a receber muitos pedidos, pode ser preciso um plano pago.
- Recomenda-se ativar em *Account → Security* a restrição ao domínio do site e, se possível, o reCAPTCHA, para evitar envios automáticos.
- Estes e-mails contêm dados de saúde (medicação). Antes de abrir os formulários ao público, o destino deve ser um e-mail institucional da USF e a solução deve ser validada pelo Encarregado de Proteção de Dados da ULS.

## 8. Médico recomendado nos pedidos

Quando o utente tem sessão iniciada, cada pedido de marcação ou de receituário guarda o médico escolhido (até aos últimos 20 pedidos). Da vez seguinte, o formulário já aparece com o médico **escolhido mais vezes** (em caso de empate, o mais recente); se ainda não houver pedidos, usa o médico indicado no perfil. No perfil, se o médico mais escolhido for diferente do indicado, aparece a sugestão "Associar como meu médico de família".

**Importante:** as regras do Firestore mudaram para permitir guardar este histórico. Volte a colar `firestore.rules` em *Firestore → Regras* e clique em **Publicar**.

## 9. Notícias

As notícias estão no ficheiro `noticias.js`. Para acrescentar uma, copie o bloco da notícia existente, cole-o no início da lista e altere título, data, texto e ficheiros. A página inicial mostra as 3 mais recentes; a página *Notícias* mostra todas.

As imagens e os vídeos ficam no repositório, ao lado das páginas. O GitHub só aceita ficheiros até **25 MB** quando se carregam pelo navegador, por isso os vídeos têm de ser comprimidos (por exemplo, em 720p).

## 10. Línguas

O site abre sempre em português. O utente pode escolher inglês, espanhol, francês ou árabe no seletor ao lado do menu; a escolha mantém-se enquanto o separador estiver aberto.

As traduções estão nos ficheiros `lingua-en.js`, `lingua-es.js`, `lingua-fr.js` e `lingua-ar.js`, no formato `"texto em português": "tradução"`. **Quando mudar um texto do site em português, tem de mudar também a frase correspondente em cada um destes ficheiros**; se não o fizer, esse texto aparece em português nas outras línguas. Os pedidos enviados por e-mail chegam sempre em português, seja qual for a língua escolhida.

## 11. Pedidos com sessão iniciada (atualização de 18/11)

- Com sessão iniciada, o pedido usa o **nome da ficha do utente**: o campo "Nome" fica escondido e o utente só confirma o n.º de utente (já preenchido) e o médico de família (o recomendado aparece já escolhido). Se escrever um n.º de utente diferente do da conta (por exemplo, para um familiar), o campo "Nome" volta a aparecer e é obrigatório.
- **Marcação de consulta:** tem um campo opcional "Tipo de consulta", com as consultas da página inicial. No e-mail aparece "Tipo de consulta" (ou "Não indicado").
- **Renovação de medicação crónica:** o utente tem de escolher pelo menos uma forma de receber as receitas (SMS, e-mail ou papel). No e-mail aparece "Envio das receitas".
- O modelo do EmailJS não precisa de ser alterado: estes dados já vão dentro de `{{{mensagem_html}}}`.

## 12. Área do Utente e rodapé (atualização de 19/11)

- A página *Área do Utente* tem agora os **Direitos e Deveres** e **Os nossos compromissos**. Para alterar estes textos, edite `area-do-utente.html` e lembre-se de atualizar também as frases nos ficheiros `lingua-…`.
- O **Livro de Reclamações e Elogios** está no rodapé, por baixo do Horário, com o símbolo; abre a página de reclamações da ERS (o endereço está em `site.js` → `livroReclamacoes`).
