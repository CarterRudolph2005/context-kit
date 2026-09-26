import { TestBed } from '@angular/core/testing';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DEFAULT_ANSWERS } from '../../kit/kit-answers';
import { TemplateCompiler } from './template-compiler';
import { ZipGenerator } from './zip-generator';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

describe('ZipGenerator', () => {
  let service: ZipGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZipGenerator);
    vi.clearAllMocks();
  });

  it('puts every file under the slug and preserves its contents', async () => {
    const files = [
      { path: 'AGENTS.md', content: '# Rules\n' },
      { path: 'context/state.md', content: 'Setup: INCOMPLETE\n' },
    ];
    const blob = await service.buildZip(files, 'sleep-lab');
    const loaded = await JSZip.loadAsync(await blob.arrayBuffer());
    const paths = Object.keys(loaded.files).filter((path) => !loaded.files[path].dir);

    expect(paths).toEqual(['sleep-lab/AGENTS.md', 'sleep-lab/context/state.md']);
    expect(paths.every((path) => path.startsWith('sleep-lab/'))).toBe(true);
    expect(await loaded.file('sleep-lab/AGENTS.md')!.async('string')).toBe('# Rules\n');
    expect(await loaded.file('sleep-lab/context/state.md')!.async('string')).toBe(
      'Setup: INCOMPLETE\n',
    );
  });

  it('compiles, zips, and saves with the normalized slug', async () => {
    const compiler = TestBed.inject(TemplateCompiler);
    vi.spyOn(compiler, 'compile').mockReturnValue([{ path: 'START-HERE.md', content: 'Hi' }]);
    const build = vi.spyOn(service, 'buildZip').mockResolvedValue(new Blob(['zip']));
    const answers = {
      ...DEFAULT_ANSWERS,
      track: 'research' as const,
      userName: 'Casey',
      projectName: 'Sleep Lab!',
      goal: 'Learn.',
    };

    await service.download(answers);

    expect(compiler.compile).toHaveBeenCalledWith(answers);
    expect(build).toHaveBeenCalledWith([{ path: 'START-HERE.md', content: 'Hi' }], 'sleep-lab');
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'sleep-lab-context-kit.zip');
  });
});
