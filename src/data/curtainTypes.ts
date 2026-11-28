// The curtain styles and blind types shown in the 3D try-it viewer and as card pictures.
// `pic` is how open the model is in its card picture (public/curtains/<id>.webp).
export interface CurtainType {
  id: string;
  name: string;
  desc: string;
  how: string; // what Open does, in plain words
  pic: number;
}

export const CURTAIN_TYPES: CurtainType[] = [
  { id: 'ripple', name: 'Ripple fold', desc: 'Soft, even waves on a ceiling track. Modern and calm.', how: 'Slides open in neat, even waves.', pic: 0.35 },
  { id: 'pleated', name: 'Pleated', desc: 'Neat stitched pleats at the top. Classic and tailored.', how: 'Pleats gather to each side.', pic: 0.35 },
  { id: 'eyelet', name: 'Eyelet', desc: 'Metal rings slide on a rod. Simple and easy to wash.', how: 'Rings slide along the rod.', pic: 0.35 },
  { id: 'roman', name: 'Roman blind', desc: 'Fabric that folds up in soft layers.', how: 'Rises in neat folds from the bottom.', pic: 0.55 },
  { id: 'roller', name: 'Roller blind', desc: 'One smooth panel that rolls up. Easy to wipe.', how: 'Rolls up into the top box.', pic: 0.35 },
  { id: 'zebra', name: 'Zebra blind', desc: 'Sheer and solid stripes for light or privacy.', how: 'First the stripes line up to let light in, then it rolls up.', pic: 0.12 },
  { id: 'vertical', name: 'Vertical blind', desc: 'Tall slats for wide windows and sliding doors.', how: 'Slats turn to let light in, then slide to one side.', pic: 0.3 },
  { id: 'venetian', name: 'Wooden blind', desc: 'Slats that tilt to control light. A warm look.', how: 'Slats tilt open, then the blind lifts up.', pic: 0.3 },
  { id: 'blackout', name: 'Blackout', desc: 'Dark, lined fabric for sleep, screens and heat.', how: 'Close it and watch the room go dark.', pic: 0.25 },
  { id: 'layers', name: 'Sheer + blackout', desc: 'A sheer in front for the day, blackout behind for the night.', how: 'Opens the blackout first, then the sheer.', pic: 0.5 },
  { id: 'motorised', name: 'Motorised', desc: 'Opens and closes from a remote, phone or schedule.', how: 'Tap Open: the motor glides it like the real thing.', pic: 0.4 },
];

export const TYPE_BY_ID = Object.fromEntries(CURTAIN_TYPES.map((t) => [t.id, t])) as Record<string, CurtainType>;
export const hasPic = (id: string) => id in TYPE_BY_ID;
