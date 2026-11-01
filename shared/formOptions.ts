import type { EventType } from "./schema.js";

/** Ceremonies and customs people can pick for each kind of event. */
export const WEDDING_TRADITIONS = [
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Baraat",
  "Pheras",
  "Nikah",
  "Church ceremony",
  "Anand Karaj",
  "Reception",
] as const;

export const BIRTHDAY_TRADITIONS = [
  "Puja or aarti",
  "Cake cutting",
  "Return gifts",
  "Games and music",
  "Milestone birthday",
] as const;

export const COMMUNITY_TRADITIONS = [
  "Puja or aarti",
  "Cultural performances",
  "Community meal",
  "Competitions",
  "Charity drive",
] as const;

export const TRADITIONS = [
  ...WEDDING_TRADITIONS,
  ...BIRTHDAY_TRADITIONS,
  ...COMMUNITY_TRADITIONS,
] as const;
export type Tradition = (typeof TRADITIONS)[number];

export const FOOD_PREFERENCES = ["Vegetarian", "Jain", "Vegan", "Veg and non-veg"] as const;
export type FoodPreference = (typeof FOOD_PREFERENCES)[number];

export const STYLES = [
  "Traditional",
  "Modern",
  "Royal",
  "Rustic and outdoors",
  "Minimal and elegant",
  "Colourful and festive",
  "Eco-friendly",
  "Fun and playful",
] as const;
export type Style = (typeof STYLES)[number];

export const MAX_TRADITIONS = 6;
export const MAX_STYLES = 3;

const TRADITIONS_BY_TYPE: Record<EventType, readonly Tradition[]> = {
  wedding: WEDDING_TRADITIONS,
  birthday: BIRTHDAY_TRADITIONS,
  community: COMMUNITY_TRADITIONS,
};

/** The traditions that make sense for an event type (none until a type is chosen). */
export function traditionsFor(type: EventType | ""): readonly Tradition[] {
  return type === "" ? [] : TRADITIONS_BY_TYPE[type];
}

/** Keeps only allowed values, once each, in their original order. */
export function pickAllowed(values: readonly string[], allowed: readonly string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const value of values) {
    if (allowed.includes(value) && !seen.has(value)) {
      seen.add(value);
      kept.push(value);
    }
  }
  return kept;
}

/** Adds the item if it is missing (and there is room), or removes it if it is there. */
export function toggleChoice(list: readonly string[], item: string, max: number): string[] {
  if (list.includes(item)) return list.filter((entry) => entry !== item);
  return list.length >= max ? [...list] : [...list, item];
}
