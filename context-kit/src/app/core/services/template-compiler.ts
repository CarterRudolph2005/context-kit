import { Injectable } from '@angular/core';
import { KitAnswers } from '../../kit/kit-answers';
import { KitFile } from '../../kit/kit-file';
import { TEMPLATES } from '../../kit/templates.generated';

@Injectable({ providedIn: 'root' })
export class TemplateCompiler {
  compile(_answers: KitAnswers, _templates: Record<string, string> = TEMPLATES): KitFile[] {
    return [];
  }
}
