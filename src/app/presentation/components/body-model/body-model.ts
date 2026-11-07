import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BodyRegionId } from '../../../domain/models/body-region';
import { BodyScene, HeatMap } from './body-scene';

/** Corpo 3D clicável. Mostra a região escolhida e o "calor" dos sintomas registrados. */
@Component({
  selector: 'app-body-model',
  templateUrl: './body-model.html',
  styleUrl: './body-model.scss',
})
export class BodyModel {
  readonly selected = input<BodyRegionId | null>(null);
  readonly heat = input<HeatMap>({});
  readonly picked = output<BodyRegionId>();

  protected readonly side = signal<'front' | 'back'>('front');
  protected readonly unsupported = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private scene?: BodyScene;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        this.scene = new BodyScene(
          this.canvas().nativeElement,
          (region) => this.picked.emit(region),
          reducedMotion,
        );
      } catch {
        this.unsupported.set(true);
        return;
      }
      const observer = new ResizeObserver(([entry]) =>
        this.scene?.resize(entry.contentRect.width, entry.contentRect.height),
      );
      observer.observe(this.host.nativeElement);
      this.scene.setHeat(this.heat());
      this.scene.setSelected(this.selected());
      destroyRef.onDestroy(() => {
        observer.disconnect();
        this.scene?.dispose();
      });
    });

    // Lê os sinais antes de usar a cena, para o effect registrar a dependência mesmo antes de ela existir.
    effect(() => {
      const selected = this.selected();
      this.scene?.setSelected(selected);
    });
    effect(() => {
      const heat = this.heat();
      this.scene?.setHeat(heat);
    });
  }

  flash(region: BodyRegionId): void {
    this.scene?.flash(region);
  }

  protected turn(side: 'front' | 'back'): void {
    this.side.set(side);
    this.scene?.turn(side);
  }
}
