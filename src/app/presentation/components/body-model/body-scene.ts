import {
  AmbientLight,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BodyRegionId } from '../../../domain/models/body-region';

export type HeatMap = Partial<Record<BodyRegionId, number>>;

const SKIN = new Color('#8f86ad');
const SKIN_HOVER = new Color('#a79fc4');
const SELECTED = new Color('#f4b860');
const HEAT = ['#000000', '#8c6577', '#b0705a', '#d48647', '#eea648', '#ffd27a'].map(
  (c) => new Color(c),
);
const UP = new Vector3(0, 1, 0);
const TARGET = new Vector3(0, 0.9, 0);

interface RegionVisual {
  readonly materials: MeshStandardMaterial[];
  heat: number;
}

/**
 * Manequim 3D estilizado, montado com primitivas (sem arquivos externos),
 * em que cada parte pertence a uma região do corpo.
 */
export class BodyScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(28, 1, 0.1, 50);
  private readonly controls: OrbitControls;
  private readonly raycaster = new Raycaster();
  private readonly body = new Group();
  private readonly regions = new Map<BodyRegionId, RegionVisual>();
  private readonly pickables: Object3D[] = [];
  private readonly halo: Mesh<RingGeometry, MeshBasicMaterial>;
  private readonly floor: Mesh<CircleGeometry, MeshBasicMaterial>;

  private selected: BodyRegionId | null = null;
  private hovered: BodyRegionId | null = null;
  private pointerDown: { x: number; y: number } | null = null;
  private pulse: { region: BodyRegionId; start: number } | null = null;
  private frame = 0;
  private turnTo: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onPick: (region: BodyRegionId) => void,
    private readonly reducedMotion: boolean,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera.position.set(0, 1.0, 4.1);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(TARGET);
    this.controls.enablePan = false;
    this.controls.enableDamping = !reducedMotion;
    this.controls.minDistance = 2.6;
    this.controls.maxDistance = 6;
    this.controls.minPolarAngle = Math.PI * 0.32;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.update();

    this.scene.add(new HemisphereLight('#d9d0ff', '#1b1530', 1.6));
    this.scene.add(new AmbientLight('#ffffff', 0.25));
    const key = new DirectionalLight('#fff1dc', 2.2);
    key.position.set(2, 3, 3);
    const rim = new DirectionalLight('#8e7dff', 2.4);
    rim.position.set(-2.5, 2, -3);
    this.scene.add(key, rim);

    this.floor = new Mesh(
      new CircleGeometry(0.55, 64),
      new MeshBasicMaterial({ color: '#2b2440', transparent: true, opacity: 0.9 }),
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0.001;
    this.halo = new Mesh(
      new RingGeometry(0.58, 0.68, 96),
      new MeshBasicMaterial({ color: '#3e3659', transparent: true, opacity: 0.9 }),
    );
    this.halo.rotation.x = -Math.PI / 2;
    this.halo.position.y = 0.002;
    this.halo.userData['region'] = 'whole-body' satisfies BodyRegionId;
    this.pickables.push(this.halo, this.floor);
    this.floor.userData['region'] = 'whole-body';
    this.regions.set('whole-body', { materials: [], heat: 0 });

    this.buildBody();
    this.scene.add(this.floor, this.halo, this.body);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    this.loop();
  }

  resize(width: number, height: number): void {
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Em telas estreitas, afasta a câmera para o corpo inteiro caber.
    const fit = this.camera.aspect < 0.6 ? 0.6 / this.camera.aspect : 1;
    this.camera.position
      .sub(TARGET)
      .setLength(4.1 * fit)
      .add(TARGET);
    this.camera.updateProjectionMatrix();
  }

  setSelected(region: BodyRegionId | null): void {
    this.selected = region;
    this.repaint();
  }

  setHeat(heat: HeatMap): void {
    for (const [id, visual] of this.regions) visual.heat = heat[id] ?? 0;
    this.repaint();
  }

  /** Brilho breve na região, confirmando um registro. */
  flash(region: BodyRegionId): void {
    if (this.reducedMotion) return;
    this.pulse = { region, start: performance.now() };
  }

  /** Gira o corpo para mostrar a frente ou as costas. */
  turn(side: 'front' | 'back'): void {
    const angle = side === 'front' ? 0 : Math.PI;
    if (this.reducedMotion) {
      this.setAzimuth(angle);
    } else {
      this.turnTo = angle;
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        (obj.material as MeshStandardMaterial).dispose();
      }
    });
    this.renderer.dispose();
  }

  // ---- Construção do manequim ----

  private buildBody(): void {
    // Cabeça e pescoço
    const head = new SphereGeometry(0.105, 40, 32);
    head.scale(0.92, 1.12, 1);
    this.addPart('head', head, new Vector3(0, 1.64, 0));
    this.addLimb('head', new Vector3(0, 1.47, 0), new Vector3(0, 1.56, 0), 0.048, 0.042);

    // Tronco: peito e dorso, do quadril aos ombros
    this.addLathe('torso', [
      [0, 1.0],
      [0.135, 1.0],
      [0.15, 1.1],
      [0.172, 1.24],
      [0.19, 1.35],
      [0.18, 1.42],
      [0.11, 1.47],
      [0.05, 1.49],
      [0, 1.49],
    ]);

    // Abdômen e pelve
    this.addLathe('abdomen', [
      [0, 0.77],
      [0.09, 0.775],
      [0.155, 0.83],
      [0.168, 0.9],
      [0.145, 0.98],
      [0.135, 1.005],
      [0, 1.005],
    ]);

    for (const side of [-1, 1]) {
      const s = (x: number, y: number, z = 0) => new Vector3(x * side, y, z);
      // Braços
      this.addLimb('arms', s(0.2, 1.4), s(0.255, 1.13), 0.05, 0.042);
      this.addLimb('arms', s(0.255, 1.13), s(0.3, 0.88, 0.03), 0.04, 0.032);
      this.addLimb('arms', s(0.3, 0.86, 0.03), s(0.315, 0.75, 0.04), 0.036, 0.026);
      // Pernas
      this.addLimb('legs', s(0.088, 0.84), s(0.098, 0.47), 0.078, 0.052);
      this.addLimb('legs', s(0.098, 0.47), s(0.102, 0.08), 0.05, 0.034);
      this.addLimb('legs', s(0.102, 0.035, -0.02), s(0.11, 0.03, 0.12), 0.036, 0.03);
    }
  }

  private material(region: BodyRegionId): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ color: SKIN, roughness: 0.62, metalness: 0.02 });
    const visual = this.regions.get(region) ?? { materials: [], heat: 0 };
    visual.materials.push(material);
    this.regions.set(region, visual);
    return material;
  }

  private addPart(region: BodyRegionId, geometry: SphereGeometry, at: Vector3): void {
    const mesh = new Mesh(geometry, this.material(region));
    mesh.position.copy(at);
    this.register(mesh, region);
  }

  private addLathe(region: BodyRegionId, profile: [number, number][]): void {
    const geometry = new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      48,
    );
    geometry.scale(1, 1, 0.62);
    this.register(new Mesh(geometry, this.material(region)), region);
  }

  /** Segmento cônico com articulações arredondadas entre dois pontos. */
  private addLimb(region: BodyRegionId, from: Vector3, to: Vector3, r1: number, r2: number): void {
    const direction = to.clone().sub(from);
    const length = direction.length();
    const material = this.material(region);

    const segment = new Mesh(new CylinderGeometry(r2, r1, length, 28, 1, true), material);
    segment.position.copy(from).addScaledVector(direction, 0.5);
    segment.quaternion.copy(new Quaternion().setFromUnitVectors(UP, direction.normalize()));
    this.register(segment, region);

    for (const [point, radius] of [
      [from, r1],
      [to, r2],
    ] as const) {
      const joint = new Mesh(new SphereGeometry(radius, 24, 16), material);
      joint.position.copy(point);
      this.register(joint, region);
    }
  }

  private register(mesh: Mesh, region: BodyRegionId): void {
    mesh.userData['region'] = region;
    this.body.add(mesh);
    this.pickables.push(mesh);
  }

  // ---- Aparência ----

  private repaint(now = performance.now()): void {
    const wholeHeat = this.regions.get('whole-body')?.heat ?? 0;
    const wholeSelected = this.selected === 'whole-body';
    const pulseStrength = this.pulseStrength(now);

    for (const [id, visual] of this.regions) {
      const isSelected = this.selected === id;
      const heat = Math.max(visual.heat, wholeHeat ? Math.max(wholeHeat - 2, 1) : 0);
      const pulse =
        this.pulse?.region === id || this.pulse?.region === 'whole-body' ? pulseStrength : 0;
      for (const m of visual.materials) {
        m.color.copy(
          isSelected || wholeSelected ? SELECTED : this.hovered === id ? SKIN_HOVER : SKIN,
        );
        m.emissive.copy(heat ? HEAT[heat] : SELECTED);
        m.emissiveIntensity = (heat ? 0.25 + heat * 0.1 : 0) + pulse * 0.9;
        if (isSelected || wholeSelected) m.emissiveIntensity = Math.max(m.emissiveIntensity, 0.18);
      }
    }

    const haloColor = wholeSelected
      ? SELECTED
      : wholeHeat
        ? HEAT[wholeHeat]
        : this.hovered === 'whole-body'
          ? new Color('#5b5180')
          : new Color('#3e3659');
    this.halo.material.color.copy(haloColor);
  }

  private pulseStrength(now: number): number {
    if (!this.pulse) return 0;
    const t = (now - this.pulse.start) / 900;
    if (t >= 1) {
      this.pulse = null;
      return 0;
    }
    return Math.sin(t * Math.PI);
  }

  // ---- Interação ----

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const start = this.pointerDown;
    this.pointerDown = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
    const region = this.regionAt(event);
    if (region) this.onPick(region);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || this.pointerDown) return;
    const region = this.regionAt(event);
    if (region !== this.hovered) {
      this.hovered = region;
      this.canvas.style.cursor = region ? 'pointer' : 'grab';
      this.repaint();
    }
  };

  private readonly handlePointerLeave = (): void => {
    this.hovered = null;
    this.repaint();
  };

  private regionAt(event: PointerEvent): BodyRegionId | null {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    const [hit] = this.raycaster.intersectObjects(this.pickables, false);
    return (hit?.object.userData['region'] as BodyRegionId | undefined) ?? null;
  }

  private setAzimuth(angle: number): void {
    const offset = this.camera.position.clone().sub(TARGET);
    const radius = Math.hypot(offset.x, offset.z);
    this.camera.position.set(
      TARGET.x + Math.sin(angle) * radius,
      this.camera.position.y,
      TARGET.z + Math.cos(angle) * radius,
    );
    this.controls.update();
  }

  private readonly loop = (): void => {
    this.frame = requestAnimationFrame(this.loop);
    if (this.turnTo !== null) {
      const current = this.controls.getAzimuthalAngle();
      let delta = this.turnTo - current;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      if (Math.abs(delta) < 0.01) {
        this.setAzimuth(this.turnTo);
        this.turnTo = null;
      } else {
        this.setAzimuth(current + delta * 0.14);
      }
    }
    this.controls.update();
    if (this.pulse) this.repaint();
    this.renderer.render(this.scene, this.camera);
  };
}
