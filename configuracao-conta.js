/* =====================================================================
   CONFIGURAÇÃO DAS CONTAS E DOS PEDIDOS (EDITAR AQUI)
   Os códigos ficam neste ficheiro à parte para não se perderem quando
   o conta.js for atualizado. Ver INSTRUCOES-AUTENTICACAO.md.
   ===================================================================== */
export const AUTH_CONFIG = {
  // Dados do projeto Firebase (Consola Firebase → Definições do projeto → As suas apps → Web)
  firebase: {
    apiKey: "COLE_AQUI",
    authDomain: "COLE_AQUI.firebaseapp.com",
    projectId: "COLE_AQUI",
    appId: "COLE_AQUI"
  },

  // Dados da conta EmailJS (https://www.emailjs.com)
  emailjs: {
    serviceId: "",
    publicKey: "",
    templateId: "",         // modelo do aviso de nova conta
    templatePedidos: ""     // modelo dos pedidos de consulta e de receituário
  },

  // Para onde vai o aviso sempre que alguém cria conta
  emailNotificacao: "carolinaapinto2006@gmail.com",
  // Para onde vão os pedidos de marcação de consulta e de renovação de receituário
  emailPedidos: "carolinaapinto2006@gmail.com",

  // Chave Móvel Digital: só funciona depois de a ULS aderir ao Autenticação.gov (ver instruções)
  chaveMovelDigital: {
    ativo: false,
    url: ""
  }
};
