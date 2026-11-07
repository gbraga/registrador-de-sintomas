export type BodyRegionId = 'head' | 'torso' | 'abdomen' | 'arms' | 'legs' | 'whole-body';

export interface BodyRegion {
  readonly id: BodyRegionId;
  readonly name: string;
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  { id: 'head', name: 'Cabeça e pescoço' },
  { id: 'torso', name: 'Tronco' },
  { id: 'abdomen', name: 'Abdômen e pelve' },
  { id: 'arms', name: 'Braços e mãos' },
  { id: 'legs', name: 'Pernas e pés' },
  { id: 'whole-body', name: 'Corpo inteiro' },
];

export function findRegion(id: BodyRegionId): BodyRegion {
  const region = BODY_REGIONS.find((r) => r.id === id);
  if (!region) throw new Error(`Região desconhecida: ${id}`);
  return region;
}
