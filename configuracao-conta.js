/* =====================================================================
   CONFIGURAÇÃO DAS CONTAS E DOS PEDIDOS (EDITAR AQUI)
   Os códigos ficam neste ficheiro à parte para não se perderem quando
   o conta.js for atualizado. Ver INSTRUCOES-AUTENTICACAO.md.
   ===================================================================== */
export const AUTH_CONFIG = {
  // Dados do projeto Firebase (Consola Firebase → Definições do projeto → As suas apps → Web)
  firebase: {
    apiKey: "AIzaSyD64O_VCFRJ2Cxfx2hWlGfFyKP0WXt6qcM",
    authDomain: "usf-covelo.firebaseapp.com",
    projectId: "usf-covelo",
    appId: "1:656683983934:web:12ed65a98ef7d445885d6f"
  },

  // Dados da conta EmailJS (https://www.emailjs.com)
  emailjs: {
    serviceId: "service_f7t4uda",
    publicKey: "a1B2c3D4e5F6g7H8i",
    templateId: "template_d72ylty",         // modelo do aviso de nova conta
    templatePedidos: "template_lutijtl"     // modelo dos pedidos de consulta e de receituário
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
