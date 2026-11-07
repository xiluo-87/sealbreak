/** Who can speak in dialogue. `portrait` names a portrait sprite set. */
export interface Speaker {
  name: string;
  portrait?: string;
}

export const SPEAKERS: Record<string, Speaker> = {
  rookie: { name: '{name}', portrait: 'rookie-portrait' },
  odile: { name: 'Odile', portrait: 'odile-portrait' },
  juniper: { name: 'Juniper', portrait: 'juniper-portrait' },
  fenn: { name: 'Fenn', portrait: 'fenn-portrait' },
  mudge: { name: 'Mudge' },
  traveller: { name: 'Carter' },
  admirer: { name: 'Goat fancier' },
  child: { name: 'Small child' },
  bride: { name: 'The bride' },
  owner: { name: 'Dog owner' },
  local: { name: 'Helpful local' },
  pim: { name: 'Pim' },
  peddler: { name: 'Peddler' },
  lineman: { name: 'Lineman' },
  tollman: { name: 'Man with a bucket' },
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
