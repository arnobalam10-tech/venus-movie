interface PersonGreetings {
  match: string[];
  messages: string[];
}

const GREETINGS: PersonGreetings[] = [
  {
    match: ["ahbab"],
    messages: [
      "kire new yorker ki dekhbi",
      "trump zindabad",
      "Homedepot te share kobe nicchos",
      "5$ de na bhai pls",
      "bhai ektu club grill khawa",
    ],
  },
  {
    match: ["irad"],
    messages: [
      "kire high naki?",
      "Visa ase? naki illegal",
      "50 krona patha na",
      "egula na kore namaj kalam por",
      "Swadikaaaa",
    ],
  },
  {
    match: ["moazzir"],
    messages: [
      "kire Australian Kamla",
      "20ta Aud patha?",
      "Bramonbaria Zindabaad",
      "Kalke kaj ase, ghuma",
    ],
  },
  {
    match: ["nazifa", "nafisa"],
    messages: [
      "hae bhai cse e kor",
      "monehoi bba korle bhalo hoito",
      "kemon aso bestie",
      "keo nai dm e? ekhane ki?",
    ],
  },
  {
    match: ["borno"],
    messages: [
      "kire, aaj IPL dekhli naki?",
      "Bhai desh e kobe ferot ashish?",
      "Mumbai local e jaiga paili?",
      "Bollywood gaan shune ghum porena?",
      "Kire, biryani chara thakte parish India te?",
    ],
  },
  {
    match: ["sinah"],
    messages: ["kire ex, ki koro"],
  },
];

export function getGreetingForEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const lower = email.toLowerCase();
  const person = GREETINGS.find((p) => p.match.some((m) => lower.includes(m)));
  if (!person || person.messages.length === 0) return null;
  return person.messages[Math.floor(Math.random() * person.messages.length)];
}
