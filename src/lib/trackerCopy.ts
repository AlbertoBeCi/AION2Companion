import type { Tracker } from '../types/domain';

type LocalizedValue = { es: string; en: string };
type PresetCopy = { name: LocalizedValue; description: LocalizedValue; category: LocalizedValue };

const presets: Record<string, PresetCopy> = {
  'community-global-checklist-v1-daily-1': { name: { es: 'Misiones de Duty', en: 'Duty Missions' }, description: { es: 'Objetivo diario: 5 misiones. Registra el progreso manualmente.', en: 'Daily target: 5 missions. Track your progress manually.' }, category: { es: 'Misiones', en: 'Missions' } },
  'community-global-checklist-v1-daily-3': { name: { es: 'Nightmare', en: 'Nightmare' }, description: { es: 'Objetivo diario: 2 intentos. Registra el progreso manualmente.', en: 'Daily target: 2 attempts. Track your progress manually.' }, category: { es: 'Nightmare', en: 'Nightmare' } },
  'community-global-checklist-v1-daily-4': { name: { es: 'Conquest', en: 'Conquest' }, description: { es: 'Contador general de seguimiento diario. Objetivo: 2; algunas modalidades del juego pueden mantener cargas separadas.', en: 'General daily tracker. Target: 2; some game modes may track separate entries.' }, category: { es: 'Conquest', en: 'Conquest' } },
  'community-global-checklist-v1-daily-17': { name: { es: 'Mazmorras', en: 'Dungeons' }, description: { es: 'Marca una vez al día cuando hayas hecho tus mazmorras. Este contador es una casilla de seguimiento, no un límite del juego.', en: 'Mark this once a day after completing your dungeons. This is a checklist item, not a game limit.' }, category: { es: 'Mazmorras', en: 'Dungeons' } },
  'community-global-checklist-v1-daily-12': { name: { es: 'Llaves Shugo', en: 'Shugo Keys' }, description: { es: 'Objetivo diario: 3 llaves. Registra el progreso manualmente.', en: 'Daily target: 3 keys. Track your progress manually.' }, category: { es: 'Eventos', en: 'Events' } },
  'community-global-checklist-v1-daily-14': { name: { es: 'Llave de invasión Dimensional', en: 'Dimensional Invasion Key' }, description: { es: 'Objetivo diario: 1 llave. Registra el progreso manualmente.', en: 'Daily target: 1 key. Track your progress manually.' }, category: { es: 'Eventos', en: 'Events' } },
  'community-global-checklist-v1-weekly-1': { name: { es: 'Unknown Fissure: Daily Dungeon', en: 'Unknown Fissure: Daily Dungeon' }, description: { es: '14 entradas por semana. La asignación semanal se comparte con los otros Daily Dungeons; nivel 30+.', en: '14 entries per week. The weekly allotment is shared with the other Daily Dungeons; level 30+.' }, category: { es: 'Daily Dungeon', en: 'Daily Dungeon' } },
  'community-global-checklist-v1-weekly-2': { name: { es: 'Ascension Trial', en: 'Ascension Trial' }, description: { es: '3 entradas semanales compartidas entre las pruebas disponibles. Nivel 45+.', en: '3 weekly entries shared across the available trials. Level 45+.' }, category: { es: 'Pruebas', en: 'Trials' } },
  'community-global-checklist-v1-weekly-3': { name: { es: 'Subjugation', en: 'Subjugation' }, description: { es: '3 entradas semanales compartidas entre las cuatro mazmorras de Subjugation. Nivel 45+.', en: '3 weekly entries shared across the four Subjugation dungeons. Level 45+.' }, category: { es: 'Subjugation', en: 'Subjugation' } },
  'community-global-checklist-v1-weekly-4': { name: { es: 'Abyssal Forge: intentos', en: 'Abyssal Forge: attempts' }, description: { es: 'Hasta 4 intentos semanales; el botín de jefe final tiene su propio límite. Nivel 45+.', en: 'Up to 4 attempts per week; final boss loot has a separate limit. Level 45+.' }, category: { es: 'Sanctuary', en: 'Sanctuary' } },
  'community-global-checklist-v1-weekly-5': { name: { es: 'Chalice of Muspel: intentos', en: 'Chalice of Muspel: attempts' }, description: { es: 'Hasta 4 intentos semanales. Comprueba el límite de recompensas de jefe final en el juego. Nivel 45+.', en: 'Up to 4 attempts per week. Check the final boss reward limit in game. Level 45+.' }, category: { es: 'Sanctuary', en: 'Sanctuary' } },
  'community-global-checklist-v1-weekly-6': { name: { es: 'Corroded Decontamination Facility: intentos', en: 'Corroded Decontamination Facility: attempts' }, description: { es: 'Hasta 4 intentos semanales. Comprueba el límite de recompensas de jefe final en el juego. Nivel 45+.', en: 'Up to 4 attempts per week. Check the final boss reward limit in game. Level 45+.' }, category: { es: 'Sanctuary', en: 'Sanctuary' } },
  'community-global-checklist-v1-weekly-7': { name: { es: 'Krao Cave: Exploration', en: 'Krao Cave: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 20.', en: '7 weekly claims. Unlocks at level 20.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-8': { name: { es: 'Urugugu Canyon: Exploration', en: 'Urugugu Canyon: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 28.', en: '7 weekly claims. Unlocks at level 28.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-9': { name: { es: 'Fire Temple: Exploration', en: 'Fire Temple: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 35.', en: '7 weekly claims. Unlocks at level 35.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-10': { name: { es: 'Draupnir: Exploration', en: 'Draupnir: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 45.', en: '7 weekly claims. Unlocks at level 45.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-11': { name: { es: 'Vakron Sky Island: Exploration', en: 'Vakron Sky Island: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 45.', en: '7 weekly claims. Unlocks at level 45.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-12': { name: { es: 'Ferocious Horn Den: Exploration', en: 'Ferocious Horn Den: Exploration' }, description: { es: '7 reclamaciones semanales. Se desbloquea al nivel 45.', en: '7 weekly claims. Unlocks at level 45.' }, category: { es: 'Exploration', en: 'Exploration' } },
  'community-global-checklist-v1-weekly-13': { name: { es: 'Lower Abyss: horas de acceso', en: 'Lower Abyss: access time' }, description: { es: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', en: 'Up to 7 hours of access per week; track approximate hours manually. Level 45+.' }, category: { es: 'Abyss', en: 'Abyss' } },
  'community-global-checklist-v1-weekly-14': { name: { es: 'Middle Abyss: horas de acceso', en: 'Middle Abyss: access time' }, description: { es: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', en: 'Up to 7 hours of access per week; track approximate hours manually. Level 45+.' }, category: { es: 'Abyss', en: 'Abyss' } },
  'community-global-checklist-v1-weekly-15': { name: { es: 'Upper Abyss: horas de acceso', en: 'Upper Abyss: access time' }, description: { es: 'Hasta 7 horas semanales de acceso; registra las horas aproximadas manualmente. Nivel 45+.', en: 'Up to 7 hours of access per week; track approximate hours manually. Level 45+.' }, category: { es: 'Abyss', en: 'Abyss' } },
};

function translated(value: string, copy: LocalizedValue | undefined, language: 'es' | 'en'): string {
  return copy && (value === copy.es || value === copy.en) ? copy[language] : value;
}

export function trackerCopy(tracker: Tracker, language: 'es' | 'en') {
  const copy = presets[tracker.id];
  if (!copy || tracker.provenance !== 'community') return { name: tracker.name, description: tracker.description, category: tracker.category };
  return {
    name: translated(tracker.name, copy.name, language),
    description: translated(tracker.description, copy.description, language),
    category: translated(tracker.category, copy.category, language),
  };
}
