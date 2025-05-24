export const SIGNUP_STEPS = [
  {
    id: "account",
    title: "Compte",
    description: "Informations de base",
    fields: ["firstName", "lastName", "email", "password"],
  },
  {
    id: "personal",
    title: "Personnel",
    description: "Informations personnelles",
    fields: ["dateOfBirth", "phoneNumber"],
  },
  {
    id: "address",
    title: "Adresse",
    description: "Informations de localisation",
    fields: ["country", "city", "commune", "address"],
  },
  {
    id: "role",
    title: "Rôle",
    description: "Type d'utilisateur",
    fields: ["role", "competitionCategory"],
  },
  {
    id: "photo",
    title: "Photo",
    description: "Photo de profil",
    fields: ["photoUrl"],
  },
];
