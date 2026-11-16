import * as THREE from 'three';
import { PALETTE } from './palette.js';

export class AuroraMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawnPoints = {
      ct: [new THREE.Vector3(0, 1.6, -35), new THREE.Vector3(-4, 1.6, -35), new THREE.Vector3(4, 1.6, -35)],
      t: [new THREE.Vector3(0, 1.6, 35), new THREE.Vector3(-4, 1.6, 35), new THREE.Vector3(4, 1.6, 35)]
    };
    this.sites = {
      A: { center: new THREE.Vector3(-22, 0, -22), radius: 6 },
      B: { center: new THREE.Vector3(22, 0, 22), radius: 6 }
    };
    this.waypointGraph = {
      nodes: [
        { id: 0, pos: new THREE.Vector3(0, 0, 30) },    // T Spawn
        { id: 1, pos: new THREE.Vector3(-15, 0, 15) },  // T Tunnel entrance
        { id: 2, pos: new THREE.Vector3(15, 0, 15) },   // Runway
        { id: 3, pos: new THREE.Vector3(0, 0, 0) },     // Mid catwalk / courtyard
        { id: 4, pos: new THREE.Vector3(-22, 0, -22) }, // Site A
        { id: 5, pos: new THREE.Vector3(22, 0, 22) },   // Site B
        { id: 6, pos: new THREE.Vector3(0, 0, -30) }    // CT Spawn
      ],
      edges: [
        [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]
      ]
    };
    this.build();
  }

  build() {
    // Fog & Sky background
    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.FogExp2(PALETTE.horizon, 0.012);

    // Lights
    const hemi = new THREE.HemisphereLight(PALETTE.auroraTeal, PALETTE.darkSteel, 0.9);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(PALETTE.snow, 1.2);
    dirLight.position.set(30, 60, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Ground / Snow plain
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: PALETTE.snow, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.addCollider(new THREE.Box3(new THREE.Vector3(-60, -2, -60), new THREE.Vector3(60, 0, 60)));

    // Outer boundary walls (Arena bounds)
    this.addWall(0, 4, -50, 100, 8, 2);
    this.addWall(0, 4, 50, 100, 8, 2);
    this.addWall(-50, 4, 0, 2, 8, 100);
    this.addWall(50, 4, 0, 2, 8, 100);

    // Site A: Laboratory Dome (West)
    this.addDome(-22, 0, -22, 10, PALETTE.glacier);
    this.addBox(-22, 2, -28, 6, 4, 2, PALETTE.steel); // Lab console / cover
    this.addBox(-27, 2, -22, 2, 4, 6, PALETTE.steel); // Lab rack

    // Site B: Hangar (East)
    this.addHangar(22, 0, 22, 12, 6, 12, PALETTE.darkSteel);
    this.addBox(22, 1.5, 22, 4, 3, 4, PALETTE.crateWood); // Crates at B

    // Mid Catwalk & Service Tunnel
    this.addBox(-15, 2, 0, 4, 4, 30, PALETTE.steel); // Tunnel wall divider
    this.addBox(0, 1.5, 0, 6, 3, 6, PALETTE.crateWood); // Mid crate stack
    this.addBox(15, 2, 0, 4, 4, 30, PALETTE.glacier); // Runway wall

    // Aurora neon light strips across sky / towers
    const stripMat = new THREE.MeshBasicMaterial({ color: PALETTE.auroraGreen });
    const stripGeo = new THREE.BoxGeometry(40, 0.4, 0.4);
    const strip1 = new THREE.Mesh(stripGeo, stripMat);
    strip1.position.set(0, 18, -20);
    this.scene.add(strip1);
    const strip2 = strip1.clone();
    strip2.position.set(0, 18, 20);
    this.scene.add(strip2);
  }

  addBox(x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.addCollider(new THREE.Box3().setFromObject(mesh));
  }

  addWall(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: PALETTE.horizon, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.addCollider(new THREE.Box3().setFromObject(mesh));
  }

  addDome(x, y, z, r, color) {
    const geo = new THREE.SphereGeometry(r, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.addCollider(new THREE.Box3(
      new THREE.Vector3(x - r, y, z - r),
      new THREE.Vector3(x + r, y + r, z + r)
    ));
  }

  addHangar(x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.addCollider(new THREE.Box3().setFromObject(mesh));
  }

  addCollider(box3) {
    this.colliders.push(box3);
  }

  checkCollision(box3) {
    for (const c of this.colliders) {
      if (c.intersectsBox(box3)) return true;
    }
    return false;
  }
}
