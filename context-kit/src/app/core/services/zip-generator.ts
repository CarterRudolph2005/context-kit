import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { KitAnswers } from '../../kit/kit-answers';
import { KitFile } from '../../kit/kit-file';

@Injectable({ providedIn: 'root' })
export class ZipGenerator {
  buildZip(_files: KitFile[], _slug: string): Promise<Blob> {
    return new JSZip().generateAsync({ type: 'blob' });
  }

  async download(_answers: KitAnswers): Promise<void> {}
}
