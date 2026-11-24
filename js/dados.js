/* =====================================================================
   DADOS DO STUDIO – edite aqui preços, serviços, tempos e horários.
   O site inteiro (páginas de serviços e agendamento online) usa este arquivo.

   Cada serviço:
     { id: "codigo-unico", nome: "Nome", det: "detalhe (opcional)",
       preco: 120, min: 60, sufixo: "o par" (opcional), grupo: "Subtítulo" (opcional) }
   min = tempo médio do serviço em minutos (usado na agenda automática).
   ===================================================================== */

var DADOS = {
  nome: "Cris Lima Studio",
  whatsapp: "5541995499770",
  whatsappTexto: "(41) 99549-9770",
  instagram: "cris.limastudio",
  endereco: "Rua Roraima, 1557 – Cajuru, Curitiba – PR",

  /* Horário de funcionamento (0 = domingo … 6 = sábado). null = fechado.
     ⚠ CONFIRMAR COM A CRIS. Enquanto "horariosConfirmados" for false,
     o site mostra o aviso "sujeito a confirmação". */
  horariosConfirmados: false,
  horarios: {
    0: null,
    1: null,
    2: ["09:00", "19:00"],
    3: ["09:00", "19:00"],
    4: ["09:00", "19:00"],
    5: ["09:00", "19:00"],
    6: ["08:00", "17:00"]
  },
  passoAgendaMin: 30,       // de quanto em quanto tempo aparecem os horários
  antecedenciaHoras: 2,     // não deixa agendar em cima da hora
  diasAgenda: 30,           // quantos dias à frente aparecem na agenda

  categorias: [
    {
      id: "loiros", nome: "Loiros", pagina: "loiros.html",
      desc: "Nossa especialidade: técnicas de loiro sob medida, sempre com tratamento incluso.",
      nota: "O percentual indica o nível de preenchimento da técnica. Todo loiro inclui reconstrução ou botox.",
      itens: [
        { id: "truck", nome: "Truck", det: "50% de preenchimento, contorno em topo", preco: 400, min: 240 },
        { id: "blonde-hair-rec", nome: "Blonde Hair com Reconstrução", det: "50 / 70% de preenchimento", preco: 550, min: 300 },
        { id: "blonde-hair-botox", nome: "Blonde Hair com Botox", det: "50 / 70% de preenchimento", preco: 600, min: 300 },
        { id: "blonde-premium-rec", nome: "Blonde Premium com Reconstrução", det: "70 / 90% de preenchimento", preco: 650, min: 360 },
        { id: "blonde-premium-botox", nome: "Blonde Premium com Botox", det: "70 / 90% de preenchimento", preco: 700, min: 360 },
        { id: "mechas-rec", nome: "Mechas Iluminadas com Reconstrução", det: "30 / 50% de preenchimento", preco: 400, min: 240 },
        { id: "mechas-botox", nome: "Mechas Iluminadas com Botox", det: "30 / 50% de preenchimento", preco: 450, min: 240 }
      ]
    },
    {
      id: "hair", nome: "Hair care", aPartir: true,
      desc: "Progressiva, botox, cortes, escova e cronogramas para fios saudáveis.",
      nota: "Valores a partir de: o preço final depende do comprimento e volume do cabelo.",
      itens: [
        { id: "progressiva-formol", nome: "Progressiva com formol", preco: 220, min: 180 },
        { id: "progressiva-sem-formol", nome: "Progressiva sem formol", preco: 250, min: 180 },
        { id: "botox-capilar", nome: "Botox", preco: 190, min: 150 },
        { id: "escova", nome: "Escova", preco: 90, min: 60 },
        { id: "corte", nome: "Corte", preco: 120, min: 60 },
        { id: "tratamento", nome: "Tratamento", det: "Reconstrução, nutrição e hidratação", preco: 120, min: 60 },
        { id: "tonalizacao", nome: "Tonalização", preco: 160, min: 90 },
        { id: "matizacao", nome: "Matização", preco: 120, min: 60 },
        { id: "tintura-raiz", nome: "Tintura raiz", preco: 120, min: 90 },
        { id: "cronograma-olenka", nome: "Cronograma Olenka ou Náttyla", preco: 330, min: 60 },
        { id: "cronograma-wella", nome: "Cronograma Wella ou L’Oréal", preco: 430, min: 60 }
      ]
    },
    {
      id: "nails", nome: "Nails",
      desc: "Manicure, pedicure, alongamentos em fibra, gel e molde F1, com nail art.",
      nota: "Unhas quebradas: até 2 inclusas; as demais são cobradas à parte.",
      itens: [
        { id: "manicure", grupo: "Manicure e pedicure", nome: "Manicure", preco: 40, min: 45 },
        { id: "pedicure", grupo: "Manicure e pedicure", nome: "Pedicure", preco: 45, min: 60 },
        { id: "blindagem", grupo: "Manicure e pedicure", nome: "Blindagem", preco: 90, min: 60 },
        { id: "fibra", grupo: "Alongamentos de unhas", nome: "Fibra de vidro", preco: 250, min: 150 },
        { id: "gel-tips", grupo: "Alongamentos de unhas", nome: "Gel na Tips", preco: 190, min: 120 },
        { id: "molde-f1", grupo: "Alongamentos de unhas", nome: "Molde F1", preco: 180, min: 120 },
        { id: "soft-gel", grupo: "Alongamentos de unhas", nome: "Soft Gel", det: "com esmaltação", preco: 150, min: 90 },
        { id: "banho-gel", grupo: "Alongamentos de unhas", nome: "Banho de Gel + esmaltação", preco: 150, min: 90 },
        { id: "blindagem-esmalt", grupo: "Alongamentos de unhas", nome: "Blindagem + esmaltação", preco: 130, min: 75 },
        { id: "esmaltacao-gel", grupo: "Alongamentos de unhas", nome: "Esmaltação em gel", preco: 80, min: 60 },
        { id: "nail-art", grupo: "Alongamentos de unhas", nome: "Nail Art", preco: 10, sufixo: "o par", min: 15 },
        { id: "francesa", grupo: "Alongamentos de unhas", nome: "Francesa sorriso", preco: 20, min: 20 },
        { id: "remocao", grupo: "Alongamentos de unhas", nome: "Remoção", preco: 65, min: 45 },
        { id: "pe-gel", grupo: "Alongamentos de unhas", nome: "Pé em gel + esmaltação", preco: 130, min: 90 },
        { id: "manut-fibra", grupo: "Manutenção", grupoDet: "somente técnicas que têm manutenção", nome: "Manutenção fibra de vidro", preco: 180, min: 120 },
        { id: "manut-gel-tips", grupo: "Manutenção", grupoDet: "somente técnicas que têm manutenção", nome: "Manutenção gel na Tips", preco: 150, min: 100 },
        { id: "manut-molde-f1", grupo: "Manutenção", grupoDet: "somente técnicas que têm manutenção", nome: "Manutenção molde F1", preco: 140, min: 100 }
      ]
    },
    {
      id: "lash", nome: "Lash",
      desc: "Lash lifting e extensão de cílios nos volumes brasileiro e egípcio.",
      itens: [
        { id: "lash-lifting", nome: "Lash lifting", preco: 120, min: 60 },
        { id: "volume-brasileiro", nome: "Extensão de cílios volume brasileiro", preco: 150, min: 120 },
        { id: "volume-egipcio", nome: "Extensão de cílios volume egípcio", preco: 170, min: 150 }
      ]
    },
    {
      id: "beauty", nome: "Beauty care",
      desc: "Design de sobrancelhas, henna, brow lamination e maquiagem.",
      itens: [
        { id: "design", nome: "Design de sobrancelha", preco: 40, min: 30 },
        { id: "design-henna", nome: "Design com henna", preco: 50, min: 45 },
        { id: "depilacao-facial", nome: "Depilação facial", preco: 30, min: 20 },
        { id: "brow-lamination", nome: "Brow lamination", preco: 130, min: 60 },
        { id: "tintura-sobrancelha", nome: "Tintura de sobrancelha", preco: 50, min: 30 },
        { id: "make-flash", nome: "Maquiagem flash makeup", preco: 60, min: 30 },
        { id: "make-social", nome: "Maquiagem social", preco: 90, min: 60 },
        { id: "make-festa", nome: "Maquiagem festa sem cílios", preco: 100, min: 75 },
        { id: "make-festa-cilios", nome: "Maquiagem festa com cílios", preco: 120, min: 90 }
      ]
    },
    {
      id: "micro", nome: "Micropigmentação",
      desc: "Sobrancelhas fio a fio, lábios e olhos com acabamento natural.",
      itens: [
        { id: "micro-sobrancelha", nome: "Micropigmentação de sobrancelhas", det: "Fio a fio, retoque incluso", preco: 400, min: 150 },
        { id: "micro-labial", nome: "Micropigmentação labial", det: "Full lips, efeito batom, revitalização labial e neutralização de lábios escuros", preco: 450, min: 150 },
        { id: "micro-olhos", nome: "Micropigmentação de olhos", det: "Contorno dos olhos, efeito lápis e eyeliner", preco: 320, min: 90 }
      ]
    }
  ]
};

if (typeof module !== "undefined") module.exports = DADOS;
