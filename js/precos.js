/* =====================================================================
   TABELA DE PREÇOS – Cris Lima Studio
   Para mudar um preço, nome ou serviço, edite só este arquivo.

   Serviço:    ["Nome do serviço", "detalhe (ou vazio)", preço, "complemento (opcional)"]
               ex.: ["Nail Art", "", 10, "o par"]  ->  Nail Art ..... R$ 10,00 o par
   Subtítulo:  ["Título do grupo", null, "texto pequeno (opcional)"]
   ===================================================================== */

var PRECOS = {
  loiros: [
    ["Truck", "50% de preenchimento, contorno em topo", 400],
    ["Blonde Hair com Reconstrução", "50 / 70% de preenchimento", 550],
    ["Blonde Hair com Botox", "50 / 70% de preenchimento", 600],
    ["Blonde Premium com Reconstrução", "70 / 90% de preenchimento", 650],
    ["Blonde Premium com Botox", "70 / 90% de preenchimento", 700],
    ["Mechas Iluminadas com Reconstrução", "30 / 50% de preenchimento", 400],
    ["Mechas Iluminadas com Botox", "30 / 50% de preenchimento", 450]
  ],

  hair: [
    ["Progressiva com formol", "", 220],
    ["Progressiva sem formol", "", 250],
    ["Botox", "", 190],
    ["Escova", "", 90],
    ["Corte", "", 120],
    ["Tratamento", "Reconstrução, nutrição e hidratação", 120],
    ["Tonalização", "", 160],
    ["Matização", "", 120],
    ["Tintura raiz", "", 120],
    ["Cronograma Olenka ou Náttyla", "", 330],
    ["Cronograma Wella ou L’Oréal", "", 430]
  ],

  nails: [
    ["Manicure e pedicure", null],
    ["Manicure", "", 40],
    ["Pedicure", "", 45],
    ["Blindagem", "", 90],
    ["Alongamentos de unhas", null],
    ["Fibra de vidro", "", 250],
    ["Gel na Tips", "", 190],
    ["Molde F1", "", 180],
    ["Soft Gel", "com esmaltação", 150],
    ["Banho de Gel + esmaltação", "", 150],
    ["Blindagem + esmaltação", "", 130],
    ["Esmaltação em gel", "", 80],
    ["Nail Art", "", 10, "o par"],
    ["Francesa sorriso", "", 20],
    ["Remoção", "", 65],
    ["Pé em gel + esmaltação", "", 130],
    ["Manutenção", null, "somente técnicas que têm manutenção"],
    ["Fibra de vidro", "", 180],
    ["Gel na Tips", "", 150],
    ["Molde F1", "", 140]
  ],

  lash: [
    ["Lash lifting", "", 120],
    ["Extensão de cílios volume brasileiro", "", 150],
    ["Extensão de cílios volume egípcio", "", 170]
  ],

  beauty: [
    ["Design de sobrancelha", "", 40],
    ["Design com henna", "", 50],
    ["Depilação facial", "", 30],
    ["Brow lamination", "", 130],
    ["Tintura de sobrancelha", "", 50],
    ["Maquiagem flash makeup", "", 60],
    ["Maquiagem social", "", 90],
    ["Maquiagem festa sem cílios", "", 100],
    ["Maquiagem festa com cílios", "", 120]
  ],

  micro: [
    ["Micropigmentação de sobrancelhas", "Fio a fio, retoque incluso", 400],
    ["Micropigmentação labial", "Full lips, efeito batom, revitalização labial e neutralização de lábios escuros", 450],
    ["Micropigmentação de olhos", "Contorno dos olhos, efeito lápis e eyeliner", 320]
  ]
};

/* Seções em que o preço aparece como "a partir de" */
var A_PARTIR_DE = ["hair"];
