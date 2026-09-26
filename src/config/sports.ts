// Spor seçenekleri ve MET değerleri (Compendium of Physical Activities, yaklaşık).
// Basit hesap: her antrenman SESSION_HOURS saat sürer.

export interface Sport {
  id: string;
  label: string;
  met: number;
}

export const SESSION_HOURS = 1;

export const SPORTS: Sport[] = [
  { id: "walking", label: "Tempolu yürüyüş", met: 4.3 },
  { id: "running", label: "Koşu", met: 9.8 },
  { id: "cycling", label: "Bisiklet", met: 7.5 },
  { id: "swimming", label: "Yüzme", met: 7.0 },
  { id: "gym", label: "Fitness / ağırlık", met: 5.0 },
  { id: "hiit", label: "Kardiyo / HIIT", met: 8.0 },
  { id: "football", label: "Futbol", met: 7.0 },
  { id: "basketball", label: "Basketbol", met: 6.5 },
  { id: "volleyball", label: "Voleybol", met: 4.0 },
  { id: "tennis", label: "Tenis", met: 7.3 },
  { id: "martial", label: "Dövüş sporları", met: 10.3 },
  { id: "dance", label: "Dans", met: 5.0 },
  { id: "pilates", label: "Pilates", met: 3.0 },
  { id: "yoga", label: "Yoga", met: 2.5 },
  { id: "other", label: "Diğer", met: 5.0 },
];

export function findSport(id: string): Sport | undefined {
  return SPORTS.find((s) => s.id === id);
}
