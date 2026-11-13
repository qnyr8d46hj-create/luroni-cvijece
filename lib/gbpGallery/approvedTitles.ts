// Read-time titles approved for the current gallery posts. This map is not
// written to Firestore. A metadataOverride title on the document still wins,
// so a later manual correction is kept by the next sync.

export const APPROVED_GALLERY_TITLES: Readonly<Record<string, string>> = {
  '2719924025939426649': 'Romantični buket',
  '7147548008275532225': 'Cvjetna harmonija',
  '7011050255258978573': 'Raskoš boja',
  '4047939570653660542': 'Premium buket „Plava elegancija”',
  '2642321651677910290': 'Nježna elegancija',
  '8446843066109521103': 'Crvena klasika',
  '3352157841610244391': 'Jesenska elegancija',
  '3241958255975358749': 'Raskoš jesenskih tonova',
  '4415220057863362207': 'Jesen u buketu',
  '7191446364504786981': 'Jesenska čarolija',
}

export function approvedGalleryTitle(postId: string): string | null {
  return APPROVED_GALLERY_TITLES[postId] ?? null
}
