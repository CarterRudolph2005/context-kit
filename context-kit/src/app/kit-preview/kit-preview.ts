import { Component, computed, effect, input, signal } from '@angular/core';
import { KitFile } from '../kit/kit-file';

interface FileGroup {
  folder: string;
  files: KitFile[];
}

@Component({
  selector: 'app-kit-preview',
  templateUrl: './kit-preview.html',
})
export class KitPreview {
  readonly files = input<KitFile[]>([]);
  readonly selectedPath = signal('');
  readonly groups = computed<FileGroup[]>(() => {
    const grouped = new Map<string, KitFile[]>();
    for (const file of this.files()) {
      const slash = file.path.lastIndexOf('/');
      const folder = slash === -1 ? 'Project root' : file.path.slice(0, slash);
      grouped.set(folder, [...(grouped.get(folder) ?? []), file]);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => (a === 'Project root' ? -1 : b === 'Project root' ? 1 : a.localeCompare(b)))
      .map(([folder, files]) => ({ folder, files: files.sort((a, b) => a.path.localeCompare(b.path)) }));
  });
  readonly selectedFile = computed(() =>
    this.files().find((file) => file.path === this.selectedPath()) ?? this.files()[0],
  );

  constructor() {
    effect(() => {
      const files = this.files();
      if (!files.some((file) => file.path === this.selectedPath())) {
        this.selectedPath.set(files[0]?.path ?? '');
      }
    });
  }
}
