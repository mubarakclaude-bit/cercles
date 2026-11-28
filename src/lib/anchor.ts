/** A heading turned into a link target: "Curtains or blinds?" -> "curtains-or-blinds" */
export const anchor = (h: string) =>
  h.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
