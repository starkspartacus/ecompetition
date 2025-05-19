export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    dialCode: "+33",
  },
  {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    dialCode: "+221",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dialCode: "+225",
  },
  {
    code: "CM",
    name: "Cameroun",
    flag: "🇨🇲",
    dialCode: "+237",
  },
  {
    code: "MA",
    name: "Maroc",
    flag: "🇲🇦",
    dialCode: "+212",
  },
  {
    code: "DZ",
    name: "Algérie",
    flag: "🇩🇿",
    dialCode: "+213",
  },
  {
    code: "TN",
    name: "Tunisie",
    flag: "🇹🇳",
    dialCode: "+216",
  },
  {
    code: "ML",
    name: "Mali",
    flag: "🇲🇱",
    dialCode: "+223",
  },
  {
    code: "GN",
    name: "Guinée",
    flag: "🇬🇳",
    dialCode: "+224",
  },
  {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    dialCode: "+229",
  },
  {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    dialCode: "+228",
  },
  {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    dialCode: "+226",
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    dialCode: "+234",
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    dialCode: "+233",
  },
  {
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦",
    dialCode: "+241",
  },
  {
    code: "CG",
    name: "Congo",
    flag: "🇨🇬",
    dialCode: "+242",
  },
  {
    code: "CD",
    name: "République Démocratique du Congo",
    flag: "🇨🇩",
    dialCode: "+243",
  },
  {
    code: "MG",
    name: "Madagascar",
    flag: "🇲🇬",
    dialCode: "+261",
  },
  {
    code: "MU",
    name: "Maurice",
    flag: "🇲🇺",
    dialCode: "+230",
  },
  {
    code: "KM",
    name: "Comores",
    flag: "🇰🇲",
    dialCode: "+269",
  },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((country) => country.code === code);
};

export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return COUNTRIES.find((country) => country.dialCode === dialCode);
};
