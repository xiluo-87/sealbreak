/** Shops and inns in each town (design 9). Prices rise as the road goes on. */
import { ITEMS } from './items';
import { REGIONS } from './regions';

export interface ShopDef {
  id: string;
  name: string;
  region: string;
  /** Price multiplier on the items' base prices. */
  mult: number;
  items: string[];
  /** Flags that take a fifth off. */
  discounts?: string[];
  /** Extra stock once a flag is set (the harbour market). */
  extra?: { flag: string; items: string[] };
}

export interface InnDef {
  id: string;
  name: string;
  price: number;
  /** A flag that makes the room free. */
  freeWith?: string;
  /** A flag that adds a meal that sets the party up for the next fight. */
  mealWith?: string;
}

export const SHOPS: Record<string, ShopDef> = {
  thistle: { id: 'thistle', name: 'Dray’s Sundries', region: 'thistle', mult: 1, items: ['loaf', 'pie', 'ink', 'repel-bell', 'apple'], discounts: ['shop.discount.thistle'] },
  fen: { id: 'fen', name: 'Eel Market', region: 'fen', mult: 1.1, items: ['loaf', 'pie', 'ink', 'salts', 'repel-bell', 'apple'] },
  copperhill: { id: 'copperhill', name: 'Company Store', region: 'copperhill', mult: 1.25, items: ['loaf', 'pie', 'ink', 'salts', 'repel-bell', 'apple'] },
  salt: { id: 'salt', name: 'Salt Road Market', region: 'salt', mult: 1.4, items: ['loaf', 'pie', 'ink', 'salts', 'repel-bell', 'apple'], discounts: ['salt.warm'], extra: { flag: 'harbour.market', items: ['salts', 'pie'] } },
  kingsend: { id: 'kingsend', name: 'Kingsend Arcade', region: 'kingsend', mult: 1.6, items: ['loaf', 'pie', 'ink', 'salts', 'repel-bell', 'apple'] },
};

export const INNS: Record<string, InnDef> = {
  thistle: { id: 'thistle', name: 'The Thistle and Crown', price: 10, freeWith: 'inn.free.thistle' },
  fen: { id: 'fen', name: 'The Drowned Lantern', price: 16, mealWith: 'recipe.eelpie' },
  copperhill: { id: 'copperhill', name: 'The Davy Lamp', price: 22, mealWith: 'recipe.eelpie' },
  salt: { id: 'salt', name: 'The Salt Road Inn', price: 28, mealWith: 'recipe.eelpie' },
  kingsend: { id: 'kingsend', name: 'The Last Post', price: 34, mealWith: 'recipe.eelpie' },
};

/** What an item costs in a shop, after any discounts that apply. */
export function priceOf(shop: ShopDef, item: string, flags: Record<string, unknown>): number {
  const base = item === 'repel-bell' ? (REGIONS[shop.region]?.repelPrice ?? 25) : Math.round((ITEMS[item]?.price ?? 0) * shop.mult);
  const off = shop.discounts?.some((f) => !!flags[f]) ? 0.8 : 1;
  return Math.max(1, Math.round(base * off));
}

/** Everything a shop has for sale right now. */
export function stockOf(shop: ShopDef, flags: Record<string, unknown>): string[] {
  const extra = shop.extra && flags[shop.extra.flag] ? shop.extra.items : [];
  return [...new Set([...shop.items, ...extra])];
}

export function innPrice(inn: InnDef, flags: Record<string, unknown>): number {
  return inn.freeWith && flags[inn.freeWith] ? 0 : inn.price;
}
