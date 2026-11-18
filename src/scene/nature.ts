// Real low-poly trees, palms, bushes and flowers (CC0, from the "low poly nature pack" by flo-bit),
// loaded after the scene starts. They replace the hand-built ones, are recoloured to match the
// scene, sway in the wind, and still take part in the colour-pop. If anything fails to load,
// the hand-built trees simply stay.
import { Box3, Color, Group, MathUtils, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { World } from './build';
import { mute } from './tone';

const FILES = ['common_tree_1', 'common_tree_2', 'palm_tree_1', 'bush_2', 'bush_4', 'bush_5', 'flower_1', 'flower_2', 'plant_2'] as const;
type Name = (typeof FILES)[number];

// Fresh, slightly brighter colours than the originals; `pop` is what they turn when the
// landscaping part of the tour is reached.
const PALETTE: Record<string, { color: string; pop?: string }> = {
  leaves: { color: '#8fc467', pop: '#3dbd62' },
  leaves_dark: { color: '#6ea64d', pop: '#27a553' },
  DarkGreen: { color: '#7db85a', pop: '#2fb35a' },
  trunk: { color: '#a8855f', pop: '#9b6b3c' },
  Brown: { color: '#a8855f', pop: '#9b6b3c' },
  DarkBrown: { color: '#86694a', pop: '#8a5a2f' },
  Green: { color: '#6aa84d', pop: '#27a553' },
  Red: { color: '#f2647a', pop: '#ff3d6e' },
  Yellow: { color: '#ffc247', pop: '#ffb020' },
  Black: { color: '#3b3a3a' },
};

export async function loadNature(world: World, baseUrl: string) {
  const loader = new GLTFLoader();
  const models = {} as Record<Name, Object3D>;
  await Promise.all(
    FILES.map(async (n) => {
      const gltf = await loader.loadAsync(`${baseUrl}models/nature/${n}.glb`);
      models[n] = gltf.scene;
    }),
  );

  // one shared material per colour name
  const mats = new Map<string, MeshStandardMaterial>();
  const matFor = (name: string) => {
    let m = mats.get(name);
    if (!m) {
      const p = PALETTE[name] ?? { color: '#7db85a' };
      m = new MeshStandardMaterial({ color: p.color, roughness: 0.9, metalness: 0, flatShading: true });
      m.color.copy(mute(m.color));
      mats.set(name, m);
      if (p.pop) (world.tintsRef.landscaping ||= []).push({ m, base: m.color.clone(), to: new Color(p.pop) });
    }
    return m;
  };

  const box = new Box3();
  const size = new Vector3();
  /** A copy of a model, standing on the ground at 0, scaled to a wanted height, with our materials. */
  function place(name: Name, x: number, z: number, height: number, rot: number, sway: number) {
    const holder = new Group();
    holder.position.set(x, 0, z);
    const inner = models[name].clone(true);
    inner.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const orig = mesh.material as { name?: string };
      mesh.material = matFor(orig.name ?? '');
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    box.setFromObject(inner);
    box.getSize(size);
    const k = height / Math.max(0.001, size.y);
    inner.scale.setScalar(k);
    box.setFromObject(inner);
    inner.position.y = -box.min.y;
    inner.position.x = -(box.min.x + box.max.x) / 2;
    inner.position.z = -(box.min.z + box.max.z) / 2;
    inner.rotation.y = rot;
    holder.add(inner);
    world.gGarden.add(holder);
    if (sway > 0) world.sways.push({ g: holder, ph: x * 0.7 + z * 0.4, amp: sway });
    return holder;
  }

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // trees and palms
  world.treeSpots.forEach((t, i) => {
    if (t.type === 'palm') place('palm_tree_1', t.x, t.z, 6.4 * t.s, rnd() * 6.28, 0.012);
    else place(i % 2 ? 'common_tree_2' : 'common_tree_1', t.x, t.z, 4.6 * t.s, rnd() * 6.28, 0.016);
  });
  // a clipped row of bushes along the front of the house
  const bushes: Name[] = ['bush_2', 'bush_4', 'bush_5'];
  world.bedSpots.forEach((b, i) => place(bushes[i % 3], b.x, b.z, 0.85 + rnd() * 0.25, rnd() * 6.28, 0.01));
  // flowers in the beds
  world.flowerPoints.forEach((f, i) => place(i % 2 ? 'flower_1' : 'flower_2', f.x, f.z - 0.05, 0.9 + rnd() * 0.3, rnd() * 6.28, 0.04));
  // a few leafy plants by the patio and gate
  for (const [x, z] of [[-6.6, 3.9], [-10.3, 1.2], [3.1, 7.4], [-0.7, 7.5]] as const) place('plant_2', x, z, 0.9, rnd() * 6.28, 0.02);

  // hide the hand-built ones
  world.gProc.visible = false;
  void MathUtils;
}
