// Catalogo bevande gestito localmente: non viene sovrascritto da Dishcovery.
(() => {
  const catalog = {
  "bevande": [
    [
      "Acqua naturale Pejo in vetro",
      3,
      "75 cl",
      ""
    ],
    [
      "Acqua gassata Pejo in vetro",
      3,
      "75 cl",
      ""
    ],
    [
      "Coca-Cola in vetro 1 L",
      8,
      "1 L",
      ""
    ],
    [
      "Coca-Cola in vetro 33 cl",
      3.5,
      "33 cl",
      ""
    ],
    [
      "Fanta in PET",
      3.5,
      "45 cl",
      ""
    ]
  ],
  "birre": [
    [
      "Moretti Filtrata a Freddo",
      5,
      "55 cl",
      "4,3% Vol"
    ],
    [
      "Ichnusa Non Filtrata",
      5,
      "50 cl",
      ""
    ],
    [
      "Messina – Bionda Italiana",
      5,
      "50 cl",
      ""
    ],
    [
      "Beck's – Tedesca Bionda",
      4,
      "33 cl",
      ""
    ],
    [
      "Ceres",
      4.5,
      "33 cl",
      "7,7% Vol"
    ],
    [
      "Erdinger",
      5,
      "50 cl",
      "5,3% Vol"
    ],
    [
      "Paulaner",
      5,
      "50 cl",
      ""
    ],
    [
      "Leffe \"Blonde\"",
      10,
      "75 cl",
      "6,6% Vol"
    ],
    [
      "Leffe \"Rouge\"",
      10,
      "75 cl",
      "6,6% Vol"
    ]
  ],
  "vini_bianchi": [
    [
      "Gewürztraminer Trentino DOC",
      17,
      "75 cl",
      "Mezzacorona"
    ],
    [
      "Falanghina del Sannio DOC",
      20,
      "75 cl",
      "Feudi di San Gregorio"
    ],
    [
      "Ribolla Gialla delle Venezie IGT",
      17,
      "75 cl",
      "Villa Folini"
    ],
    [
      "Greco di Tufo DOC",
      20,
      "75 cl",
      "Feudi di San Gregorio"
    ],
    [
      "Prosecco Superiore Valdobbiadene DOC",
      15,
      "75 cl",
      "Ca Val"
    ]
  ],
  "vini_rossi": [
    [
      "Sangiovese di Romagna \"Notturno\" DOC",
      22,
      "75 cl",
      "Tenuta Drei Donà"
    ],
    [
      "Sangiovese Superiore \"Prugneto\" DOC",
      20,
      "75 cl",
      "Poderi Dal Nespoli"
    ],
    [
      "Sangiovese Superiore \"Ceregio Rosso\" DOC",
      15,
      "75 cl",
      "Fattoria Zerbina"
    ],
    [
      "Sangiovese Superiore \"Ceregio Rosso\" DOC – Mezza bottiglia",
      10,
      "37,5 cl",
      "Fattoria Zerbina"
    ],
    [
      "Valpolicella Superiore \"Ripasso\" DOC",
      18,
      "75 cl",
      "Casa Sartori"
    ]
  ]
};
  Object.entries(catalog).forEach(([category, items]) => {
    window.menuData[category] = items.map(([name, price, format, detail], index) => ({
      id: `local-${category}-${index + 1}`,
      name,
      price,
      description: [format && `Formato: ${format}`, detail].filter(Boolean).join(" • "),
      ingredients: "",
      allergens: [],
      image: "",
      payoff: "",
      order: index
    }));
  });
})();
