import { inject, Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { KitAnswers, normalizeAnswers } from '../../kit/kit-answers';
import { KitFile } from '../../kit/kit-file';
import { TemplateCompiler } from './template-compiler';

@Injectable({ providedIn: 'root' })
export class ZipGenerator {
  private readonly compiler = inject(TemplateCompiler);

  buildZip(files: KitFile[], slug: string): Promise<Blob> {
    const zip = new JSZip();
    for (const file of files) zip.file(`${slug}/${file.path}`, file.content);
    return zip.generateAsync({ type: 'blob' });
  }

  async download(answers: KitAnswers): Promise<void> {
    const normalized = normalizeAnswers(answers);
    const blob = await this.buildZip(this.compiler.compile(answers), normalized.projectSlug);
    saveAs(blob, `${normalized.projectSlug}-context-kit.zip`);
  }
}
