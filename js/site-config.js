window.PONTE_CONFIG = Object.freeze({
  restaurant: {
    name: "Al Ponte di Schiavonia",
    subtitle: "Trattoria e Pizzeria",
    phoneDisplay: "+39 0543 29448",
    phoneLink: "+39054329448",
    whatsapp: "39054329448",
    address: "Viale Livio Salinatore 86, 47121 Forlì (FC)",
    shortAddress: "Viale Livio Salinatore 86, Forlì",
    timezone: "Europe/Rome"
  },
  hours: {
    0: [],
    1: [["12:00", "14:30"], ["19:00", "23:00"]],
    2: [["12:00", "14:30"], ["19:00", "23:00"]],
    3: [["12:00", "14:30"], ["19:00", "23:00"]],
    4: [["12:00", "14:30"], ["19:00", "23:00"]],
    5: [["12:00", "14:30"], ["19:00", "23:00"]],
    6: [["12:00", "14:30"], ["19:00", "23:00"]]
  },
  ordering: {
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryAreas: ["Forlì"],
    minLeadMinutes: 30,
    slotMinutes: 15,
    maxAdvanceDays: 7,
    minOrder: 0,
    apiEndpoint: ""
  },
  availability: {
    disabledItemIds: [],
    disabledCategories: [],
    itemOverrides: {}
  },
  pizzaExtras: [
    { id: "bufala", name: "Mozzarella di Bufala DOP", price: 2.50 },
    { id: "burrata", name: "Burrata", price: 3.00 },
    { id: "prosciutto_crudo", name: "Prosciutto Crudo di Parma", price: 2.50 },
    { id: "porcini", name: "Funghi Porcini", price: 3.00 },
    { id: "salsiccia", name: "Salsiccia", price: 1.50 },
    { id: "crudo_24_mesi", name: "Crudo di Parma 24 mesi", price: 4.00 },
    { id: "salame_piccante", name: "Salame Piccante", price: 1.50 },
    { id: "gorgonzola", name: "Gorgonzola", price: 1.50 },
    { id: "scamorza", name: "Scamorza Affumicata", price: 1.50 },
    { id: "olive", name: "Olive Taggiasche", price: 1.00 },
    { id: "rucola", name: "Rucola Fresca", price: 1.00 },
    { id: "pesto", name: "Pesto alla Genovese", price: 1.50 },
    { id: "nduja", name: "'Nduja Piccante", price: 2.00 },
    { id: "truffle", name: "Olio al Tartufo", price: 3.00 }
  ],
  analytics: {
    enabled: true,
    endpoint: "",
    storageKey: "ponte-analytics-v1"
  }
});
