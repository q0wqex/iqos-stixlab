// ==========================================================================
// STIX LAB: ОФИЦИАЛЬНАЯ БАЗА СТИКОВ HEETS & FIIT И НАЧАЛЬНЫЕ ДАННЫЕ
// ==========================================================================

const CRITERIA = [
  { id: "c1", icon: "👅", name: "Приятность вкуса", short: "Вкус", desc: "Насколько гармоничен основной вкус" },
  { id: "c2", icon: "👃", name: "Приятность аромата", short: "Аромат", desc: "Запах пара и табачного бленда" },
  { id: "c3", icon: "💥", name: "Интенсивность вкуса", short: "Яркость", desc: "Насыщенность и выразительность" },
  { id: "c4", icon: "🍃", name: "Комфорт в горле", short: "Мягкость", desc: "Легкость затяжки, отсутствие горечи" },
  { id: "c5", icon: "✨", name: "Послевкусие", short: "Финиш", desc: "Приятность шлейфа после парения" }
];

const STICKS_DATA = [
  // -------------------------------------------------------------
  // КОЛЛЕКЦИЯ HEETS
  // -------------------------------------------------------------
  {
    id: "heets-green-zing",
    brand: "HEETS",
    name: "Green Zing",
    color: "#27ae60",
    colorGrad: "linear-gradient(135deg, #2ecc71, #27ae60)",
    tag: "Цитрус / Мята",
    notes: ["Цитрус", "Лайм", "Мята", "Травы"],
    desc: "Освежающий травяной бленд с нотами спелого лайма и охлаждающей мяты",
    hasCapsule: false
  },
  {
    id: "heets-purple-wave",
    brand: "HEETS",
    name: "Purple Wave",
    color: "#8e44ad",
    colorGrad: "linear-gradient(135deg, #a55eea, #8e44ad)",
    tag: "Ягоды / Холодок",
    notes: ["Лесные ягоды", "Черника", "Ментол"],
    desc: "Спелые лесные ягоды с мягким охлаждающим ментоловым бризом",
    hasCapsule: false
  },
  {
    id: "heets-amber-selection",
    brand: "HEETS",
    name: "Amber Selection",
    color: "#e67e22",
    colorGrad: "linear-gradient(135deg, #f39c12, #d35400)",
    tag: "Табак / Орехи",
    notes: ["Табак", "Древесные ноты", "Орехи"],
    desc: "Классический табачный бленд с благородными древесно-ореховыми нотами",
    hasCapsule: false
  },
  {
    id: "heets-yellow-selection",
    brand: "HEETS",
    name: "Yellow Selection",
    color: "#f1c40f",
    colorGrad: "linear-gradient(135deg, #f5cd79, #e1b12c)",
    tag: "Табак / Цитрус",
    notes: ["Светлый табак", "Пряности", "Легкий цитрус"],
    desc: "Мягкий светлый табак с деликатным цитрусовым оттенком",
    hasCapsule: false
  },
  {
    id: "heets-turquoise-selection",
    brand: "HEETS",
    name: "Turquoise Selection",
    color: "#00b894",
    colorGrad: "linear-gradient(135deg, #55efc4, #00b894)",
    tag: "Ментол / Мята",
    notes: ["Освежающий ментол", "Мята"],
    desc: "Освежающий прохладный ментол с мягкой деликатной мятой",
    hasCapsule: false
  },
  {
    id: "heets-bronze-selection",
    brand: "HEETS",
    name: "Bronze Selection",
    color: "#8d5b4c",
    colorGrad: "linear-gradient(135deg, #b07d62, #6f4e37)",
    tag: "Табак / Какао",
    notes: ["Насыщенный табак", "Какао", "Сухофрукты"],
    desc: "Глубокий табачный бленд с теплыми бархатными нотами какао и сухофруктов",
    hasCapsule: false
  },
  {
    id: "heets-silver-selection",
    brand: "HEETS",
    name: "Silver Selection",
    color: "#a4b0be",
    colorGrad: "linear-gradient(135deg, #ced6e0, #747d8c)",
    tag: "Табак / Легкий",
    notes: ["Мягкий табак", "Нейтральный"],
    desc: "Самый легкий, сдержанный и утонченный чистый табачный вкус",
    hasCapsule: false
  },
  {
    id: "heets-summer-breeze",
    brand: "HEETS",
    name: "Summer Breeze",
    color: "#fa8231",
    colorGrad: "linear-gradient(135deg, #fed330, #fa8231)",
    tag: "Персик / Ментол",
    notes: ["Персик", "Фрукты", "Прохлада"],
    desc: "Спелый персик и сочные фрукты с мягким ментоловым шлейфом",
    hasCapsule: false
  },
  {
    id: "heets-tropical-swift",
    brand: "HEETS",
    name: "Tropical Swift",
    color: "#eb3b5a",
    colorGrad: "linear-gradient(135deg, #fc5c65, #eb3b5a)",
    tag: "Тропики / Мята",
    notes: ["Тропические фрукты", "Манго", "Легкий ментол"],
    desc: "Экзотический тропический коктейль с легким охлаждающим ментолом",
    hasCapsule: false
  },
  {
    id: "heets-ruby-fuse",
    brand: "HEETS",
    name: "Ruby Fuse",
    color: "#c0392b",
    colorGrad: "linear-gradient(135deg, #e74c3c, #962d22)",
    tag: "Красные ягоды",
    notes: ["Красные ягоды", "Малина", "Цветочные ноты"],
    desc: "Сочные красные ягоды с нежным цветочным ароматом без холодка",
    hasCapsule: false
  },
  {
    id: "heets-sun-pearl",
    brand: "HEETS",
    name: "Sun Pearl",
    color: "#ff5252",
    colorGrad: "linear-gradient(135deg, #ff7675, #d63031)",
    tag: "Капсула / Арбуз",
    notes: ["Капсула", "Арбуз", "Мята"],
    desc: "С кнопкой: взрыв сочного летнего арбуза и бодрящего ментола",
    hasCapsule: true
  },
  {
    id: "heets-arbor-pearl",
    brand: "HEETS",
    name: "Arbor Pearl",
    color: "#2ed573",
    colorGrad: "linear-gradient(135deg, #7bed9f, #2ed573)",
    tag: "Капсула / Яблоко",
    notes: ["Капсула", "Зеленое яблоко", "Лед"],
    desc: "С кнопкой: хрустящее зеленое яблоко с ледяной прохладой",
    hasCapsule: true
  },

  // -------------------------------------------------------------
  // КОЛЛЕКЦИЯ FIIT
  // -------------------------------------------------------------
  {
    id: "fiit-viola",
    brand: "FIIT",
    name: "Viola",
    color: "#9b59b6",
    colorGrad: "linear-gradient(135deg, #be2edd, #8854d0)",
    tag: "Ягоды / Свежесть",
    notes: ["Сладкие ягоды", "Черника", "Свежесть"],
    desc: "Сладкие лесные ягоды с мягким освежающим ягодным послевкусием",
    hasCapsule: false
  },
  {
    id: "fiit-crisp",
    brand: "FIIT",
    name: "Crisp",
    color: "#20bf6b",
    colorGrad: "linear-gradient(135deg, #26de81, #20bf6b)",
    tag: "Цитрус / Травы",
    notes: ["Цитрус", "Пряные травы", "Ментол"],
    desc: "Освежающий цитрусово-травяной бленд с бодрящей ментоловой прохладой",
    hasCapsule: false
  },
  {
    id: "fiit-regular",
    brand: "FIIT",
    name: "Regular",
    color: "#4b6584",
    colorGrad: "linear-gradient(135deg, #778ca3, #4b6584)",
    tag: "Табак / Орехи",
    notes: ["Классический табак", "Орехи"],
    desc: "Чистый классический табачный вкус с легким мягким ореховым оттенком",
    hasCapsule: false
  },
  {
    id: "fiit-marine",
    brand: "FIIT",
    name: "Marine",
    color: "#0fb9b1",
    colorGrad: "linear-gradient(135deg, #2bcbba, #0fb9b1)",
    tag: "Морской ментол",
    notes: ["Ледяной ментол", "Морская свежесть"],
    desc: "Бодрящий морской ментол с выраженным приятным ледяным ощущением",
    hasCapsule: false
  },
  {
    id: "fiit-spring",
    brand: "FIIT",
    name: "Spring",
    color: "#fd79a8",
    colorGrad: "linear-gradient(135deg, #ff9ff3, #fd79a8)",
    tag: "Фрукты / Цветы",
    notes: ["Весенние цветы", "Фрукты", "Мягкая свежесть"],
    desc: "Нежный цветочно-фруктовый весенний бленд с деликатной прохладой",
    hasCapsule: false
  },
  {
    id: "fiit-tropic",
    brand: "FIIT",
    name: "Tropic",
    color: "#f39c12",
    colorGrad: "linear-gradient(135deg, #fed330, #f39c12)",
    tag: "Тропики / Цитрус",
    notes: ["Тропические фрукты", "Ананас", "Свежесть"],
    desc: "Сочный тропический фруктовый коктейль со сладким мягким финишем",
    hasCapsule: false
  },
  {
    id: "fiit-shine",
    brand: "FIIT",
    name: "Shine",
    color: "#ff9f43",
    colorGrad: "linear-gradient(135deg, #feca57, #ff9f43)",
    tag: "Капсула / Персик",
    notes: ["Капсула", "Персик", "Цитрус", "Мята"],
    desc: "С кнопкой: игристый персиково-цитрусовый взрыв со свежестью",
    hasCapsule: true
  },
  {
    id: "fiit-pulse",
    brand: "FIIT",
    name: "Pulse",
    color: "#6c5ce7",
    colorGrad: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
    tag: "Капсула / Ежевика",
    notes: ["Капсула", "Ежевика", "Лед"],
    desc: "С кнопкой: взрыв спелой дикой ежевики и глубокого ледяного ментола",
    hasCapsule: true
  }
];

// Начальные демонстрационные оценки для пары (Андрей и Катя)
const INITIAL_DEMO_RATINGS = {
  "heets-green-zing": {
    u1: { c1: 4, c2: 3, c3: 4, c4: 5, c5: 5 }, // avg 4.2
    u2: { c1: 4, c2: 4, c3: 5, c4: 5, c5: 5 }, // avg 4.6
    notes: "Отличный лаймовый холодок, идеален на лето!"
  },
  "fiit-viola": {
    u1: { c1: 4, c2: 4, c3: 4, c4: 4, c5: 4 }, // avg 4.0
    u2: { c1: 5, c2: 5, c3: 5, c4: 4, c5: 5 }, // avg 4.8
    notes: "Любимый ягодный вкус Кати, очень нежный пар"
  },
  "heets-purple-wave": {
    u1: { c1: 4, c2: 4, c3: 4, c4: 5, c5: 4 }, // avg 4.2
    u2: { c1: 5, c2: 4, c3: 4, c4: 5, c5: 4 }, // avg 4.4
    notes: "Сбалансированная черника и ментол"
  },
  "heets-amber-selection": {
    u1: { c1: 5, c2: 4, c3: 4, c4: 4, c5: 4 }, // avg 4.2
    u2: { c1: 3, c2: 3, c3: 4, c4: 4, c5: 3 }, // avg 3.4
    notes: "Классический табак под утренний эспрессо"
  }
};
