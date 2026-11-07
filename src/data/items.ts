/** Items (design section 9). Kept small: the letters are the build. */
export interface ItemDef {
  id: string;
  name: string;
  description: string;
  price: number;
  battle: boolean;
  heal?: number;
  restoreFp?: number;
  revive?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  loaf: { id: 'loaf', name: 'Loaf', description: 'Bread. Restores 30 HP.', price: 8, battle: true, heal: 30 },
  pie: { id: 'pie', name: 'Pie', description: 'A proper pie. Restores 70 HP.', price: 20, battle: true, heal: 70 },
  ink: { id: 'ink', name: 'Ink', description: 'A pot of good ink. Restores 12 FP.', price: 15, battle: true, restoreFp: 12 },
  salts: { id: 'salts', name: 'Smelling Salts', description: 'Revives a fallen ally with a quarter of their HP.', price: 30, battle: true, revive: true },
  'repel-bell': { id: 'repel-bell', name: 'Repel Bell', description: 'Ring it and wildlife keeps its distance for a while.', price: 25, battle: false },
  apple: { id: 'apple', name: 'Apple', description: 'For Biscuit. Biscuit thinks so too.', price: 3, battle: false },
};

/** What a new game starts with. */
export const START_ITEMS: Record<string, number> = { loaf: 3, 'repel-bell': 1 };
export const START_COIN = 20;
