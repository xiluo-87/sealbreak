/** Who can speak in dialogue. `portrait` names a portrait sprite set. */
export interface Speaker {
  name: string;
  portrait?: string;
}

export const SPEAKERS: Record<string, Speaker> = {
  rookie: { name: '{name}', portrait: 'rookie-portrait' },
  odile: { name: 'Odile', portrait: 'odile-portrait' },
  juniper: { name: 'Juniper', portrait: 'juniper-portrait' },
  ned: { name: 'Ned Cobb' },
  mayor: { name: 'Mayor Pell' },
  hester: { name: 'Hester Lamb' },
  finch: { name: 'Mother Finch' },
  gil: { name: 'Gil Ashby' },
  dray: { name: 'Mrs. Dray' },
  wireman: { name: 'Wireman' },
  tib: { name: 'Tib' },
  brigand: { name: 'Road Brigand' },
};
