// ==========================================================================
// STIX LAB: ОФИЦИАЛЬНАЯ БАЗА СТИКОВ HEETS 2.0 & FIIT
// Составлена по наборам коллекций вкусов и дегустационной таблице Андрея и Кати
// ==========================================================================

const CRITERIA = [
  { id: "c1", icon: "👅", name: "Приятность вкуса", short: "Вкус", desc: "Насколько гармоничен и приятен основной вкус" },
  { id: "c2", icon: "👃", name: "Приятность аромата", short: "Аромат", desc: "Приятность запаха пара и табачного бленда" },
  { id: "c3", icon: "💥", name: "Интенсивность, яркость вкуса", short: "Яркость", desc: "Насыщенность, выразительность и глубина" },
  { id: "c4", icon: "🍃", name: "Комфорт во рту и горле", short: "Комфорт", desc: "Мягкость затяжки, отсутствие жжения и горечи" },
  { id: "c5", icon: "✨", name: "Послевкусие", short: "Финиш", desc: "Приятность и чистота шлейфа после парения" }
];

const STICKS_DATA = [
  // -------------------------------------------------------------
  // КОЛЛЕКЦИЯ HEETS 2.0 (10 вкусов из набора)
  // -------------------------------------------------------------
  {
    id: "heets-purple-wave",
    brand: "HEETS",
    name: "Purple Wave",
    category: "Ароматические",
    color: "#9d7bb0",
    colorGrad: "linear-gradient(135deg, #bfa6d4, #8b749d)",
    tag: "Ягоды / Свежесть",
    notes: ["Ягоды", "Лесные ягоды", "Свежесть"],
    desc: "Ягодный и свежий",
    hasCapsule: false
  },
  {
    id: "heets-summer-breeze",
    brand: "HEETS",
    name: "Summer Breeze",
    category: "Ароматические",
    color: "#f5a75b",
    colorGrad: "linear-gradient(135deg, #f7be85, #e68a35)",
    tag: "Фрукты / Свежесть",
    notes: ["Фрукты", "Персик", "Свежесть"],
    desc: "Фруктовый и свежий",
    hasCapsule: false
  },
  {
    id: "heets-turquoise-selection",
    brand: "HEETS",
    name: "Turquoise Selection",
    category: "Ароматические",
    color: "#00a8cc",
    colorGrad: "linear-gradient(135deg, #26c6da, #0097a7)",
    tag: "Мята / Бодрость",
    notes: ["Ментол", "Освежающий", "Мята"],
    desc: "Освежающий и бодрящий",
    hasCapsule: false
  },
  {
    id: "heets-green-zing",
    brand: "HEETS",
    name: "Green Zing",
    category: "Ароматические",
    color: "#a6d341",
    colorGrad: "linear-gradient(135deg, #c4e538, #88c62b)",
    tag: "Цитрус / Свежесть",
    notes: ["Цитрус", "Лайм", "Мята"],
    desc: "Цитрусовый и свежий",
    hasCapsule: false
  },
  {
    id: "heets-green-selection",
    brand: "HEETS",
    name: "Green Selection",
    category: "Ароматические",
    color: "#009e4f",
    colorGrad: "linear-gradient(135deg, #2ecc71, #009432)",
    tag: "Сладкая мята",
    notes: ["Сладкая мята", "Сладкий фильтр", "Свежесть"],
    desc: "Яркий и освежающий",
    hasCapsule: false
  },
  {
    id: "heets-cameo-wave",
    brand: "HEETS",
    name: "Cameo Wave",
    category: "Ароматические",
    color: "#ea5b88",
    colorGrad: "linear-gradient(135deg, #ff7597, #e04070)",
    tag: "Экзотика / Свежесть",
    notes: ["Экзотические фрукты", "Свежесть", "Яркий"],
    desc: "Яркий и экзотический",
    hasCapsule: false
  },
  {
    id: "heets-amber-selection",
    brand: "HEETS",
    name: "Amber Selection",
    category: "Классические",
    color: "#e67e22",
    colorGrad: "linear-gradient(135deg, #f39c12, #d35400)",
    tag: "Табак / Пряности",
    notes: ["Классический табак", "Пряности", "Древесные ноты"],
    desc: "Сбалансированный и пряный",
    hasCapsule: false
  },
  {
    id: "heets-bronze-selection",
    brand: "HEETS",
    name: "Bronze Selection",
    category: "Классические",
    color: "#8d5b4c",
    colorGrad: "linear-gradient(135deg, #a06655, #6f4e37)",
    tag: "Табак / Какао",
    notes: ["Насыщенный табак", "Какао", "Теплый"],
    desc: "Насыщенный и теплый",
    hasCapsule: false
  },
  {
    id: "heets-slate-selection",
    brand: "HEETS",
    name: "Slate Selection",
    category: "Классические",
    color: "#637289",
    colorGrad: "linear-gradient(135deg, #7b8a9e, #505e73)",
    tag: "Табак / Мягкий",
    notes: ["Мягкий табак", "Нейтральный", "Утонченный"],
    desc: "Мягкий и утонченный",
    hasCapsule: false
  },
  {
    id: "heets-sun-capsule",
    brand: "HEETS",
    name: "HEETS SUN с капсулой",
    category: "С капсулой",
    color: "#eb3b5a",
    colorGrad: "linear-gradient(135deg, #fc5c65, #eb3b5a)",
    tag: "Капсула / Фрукты",
    notes: ["Капсула", "Кнопка", "Летние фрукты", "Сочный"],
    desc: "Теплые ноты летних фруктов в одно нажатие",
    hasCapsule: true
  },

  // -------------------------------------------------------------
  // КОЛЛЕКЦИЯ FIIT (10 вкусов из набора)
  // -------------------------------------------------------------
  {
    id: "fiit-viola",
    brand: "FIIT",
    name: "Viola",
    category: "Ароматические с ментолом",
    color: "#9a71b2",
    colorGrad: "linear-gradient(135deg, #b388d0, #885ca1)",
    tag: "Ягоды / Ментол",
    notes: ["Свежий", "Лесные ягоды", "Ментол"],
    desc: "Свежий и ягодный",
    hasCapsule: false
  },
  {
    id: "fiit-tropic",
    brand: "FIIT",
    name: "Tropic",
    category: "Ароматические с ментолом",
    color: "#eab527",
    colorGrad: "linear-gradient(135deg, #fed330, #e1a612)",
    tag: "Тропики / Ментол",
    notes: ["Свежий", "Экзотический", "Тропики"],
    desc: "Свежий и экзотический",
    hasCapsule: false
  },
  {
    id: "fiit-velvet",
    brand: "FIIT",
    name: "Velvet",
    category: "Ароматические с ментолом",
    color: "#a21b44",
    colorGrad: "linear-gradient(135deg, #c2185b, #880e4f)",
    tag: "Спелые ягоды",
    notes: ["Насыщенный", "Спелые ягоды", "Бархатный"],
    desc: "Насыщенный и ягодный",
    hasCapsule: false
  },
  {
    id: "fiit-marine",
    brand: "FIIT",
    name: "Marine",
    category: "Ароматические с ментолом",
    color: "#38ada9",
    colorGrad: "linear-gradient(135deg, #48dbfb, #0fb9b1)",
    tag: "Морской ментол",
    notes: ["Освежающий", "Прохладный", "Морской бриз"],
    desc: "Освежающий и прохладный",
    hasCapsule: false
  },
  {
    id: "fiit-silva-change",
    brand: "FIIT",
    name: "Silva Change с капсулой",
    category: "С капсулой",
    color: "#5f27cd",
    colorGrad: "linear-gradient(135deg, #7d5fff, #4834d4)",
    tag: "Капсула / Лесные ягоды",
    notes: ["Капсула", "Лесные ягоды", "Освежающий"],
    desc: "Освежающие ноты лесных ягод в одно нажатие",
    hasCapsule: true
  },
  {
    id: "fiit-opal-change",
    brand: "FIIT",
    name: "Opal Change с капсулой",
    category: "С капсулой",
    color: "#9c276a",
    colorGrad: "linear-gradient(135deg, #b83b82, #7f1d53)",
    tag: "Капсула / Сочные ягоды",
    notes: ["Капсула", "Сочные ягоды", "Освежающий"],
    desc: "Освежающие ноты сочных ягод в одно нажатие",
    hasCapsule: true
  },
  {
    id: "fiit-regular",
    brand: "FIIT",
    name: "Regular",
    category: "Классические",
    color: "#1e7fd8",
    colorGrad: "linear-gradient(135deg, #3498db, #1565c0)",
    tag: "Классический табак",
    notes: ["Классический табак", "Сбалансированный", "Свежий"],
    desc: "Сбалансированный и свежий",
    hasCapsule: false
  },
  {
    id: "fiit-regular-deep",
    brand: "FIIT",
    name: "Regular Deep",
    category: "Классические",
    color: "#c87a32",
    colorGrad: "linear-gradient(135deg, #e67e22, #a8581a)",
    tag: "Пряный табак",
    notes: ["Насыщенный табак", "Пряности", "Глубокий"],
    desc: "Насыщенный и пряный",
    hasCapsule: false
  },
  {
    id: "fiit-aroma-edition-brown",
    brand: "FIIT",
    name: "Aroma Edition Brown",
    category: "Ароматические без ментола",
    color: "#4e342e",
    colorGrad: "linear-gradient(135deg, #6d4c41, #3e2723)",
    tag: "Кремовый / Без ментола",
    notes: ["Кремовый", "Мягкий табак", "Без ментола"],
    desc: "Мягкий и кремовый",
    hasCapsule: false
  },
  {
    id: "fiit-aroma-edition-red",
    brand: "FIIT",
    name: "Aroma Edition Red",
    category: "Ароматические без ментола",
    color: "#7b241c",
    colorGrad: "linear-gradient(135deg, #922b21, #5c1811)",
    tag: "Ягодный / Без ментола",
    notes: ["Мягкие ягоды", "Нежный табак", "Без ментола"],
    desc: "Мягкий и ягодный",
    hasCapsule: false
  }
];

// ==========================================================================
// ФАКТИЧЕСКИЕ ОЦЕНКИ ИЗ ТАБЛИЦЫ АНДРЕЯ И КАТИ
// ==========================================================================
const INITIAL_DEMO_RATINGS = {
  // 1. HEETS Green Zing: Катя 4.6, Андрей 4.2 -> Итог 4.4
  "heets-green-zing": {
    u1: { c1: 4, c2: 3, c3: 4, c4: 5, c5: 5 }, // Андрей avg 4.2
    u2: { c1: 4, c2: 4, c3: 5, c4: 5, c5: 5 }, // Катя avg 4.6
    notes: "Яркий мятный, освежающий"
  },

  // 2. HEETS Green Selection: Катя 5.0, Андрей 5.0 -> Итог 5.0
  "heets-green-selection": {
    u1: { c1: 5, c2: 5, c3: 5, c4: 5, c5: 5 }, // Андрей avg 5.0
    u2: { c1: 5, c2: 5, c3: 5, c4: 5, c5: 5 }, // Катя avg 5.0
    notes: "Сладкий фильтр, сладкая мята, приятное"
  },

  // 3. HEETS Slate Selection: Катя 1.6, Андрей 3.8 -> Итог 2.7
  "heets-slate-selection": {
    u1: { c1: 4, c2: 4, c3: 2, c4: 5, c5: 4 }, // Андрей avg 3.8
    u2: { c1: 2, c2: 3, c3: 0, c4: 3, c5: 0 }, // Катя avg 1.6
    notes: "Нейтральный, без особого вкуса и особенностей."
  },

  // 4. FIIT Viola: Катя 4.6, Андрей 4.2 -> Итог 4.4
  "fiit-viola": {
    u1: { c1: 4, c2: 3, c3: 4, c4: 5, c5: 5 }, // Андрей avg 4.2
    u2: { c1: 4, c2: 4, c3: 5, c4: 5, c5: 5 }, // Катя avg 4.6
    notes: "Свежий и ягодный"
  },

  // 5. FIIT Aroma Edition Brown: Катя 1.6, Андрей 3.8 -> Итог 2.7
  "fiit-aroma-edition-brown": {
    u1: { c1: 4, c2: 4, c3: 2, c4: 5, c5: 4 }, // Андрей avg 3.8
    u2: { c1: 2, c2: 3, c3: 0, c4: 3, c5: 0 }, // Катя avg 1.6
    notes: "Мягкий и кремовый"
  }
};
