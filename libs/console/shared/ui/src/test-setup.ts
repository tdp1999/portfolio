import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// jsdom has no DataTransfer / DragEvent — drag-and-drop upload specs
// (asset-upload-zone) build a DataTransfer and dispatch a DragEvent. Minimal stubs.
if (typeof globalThis.DataTransfer === 'undefined') {
  class DataTransferStub {
    private readonly _files: File[] = [];
    readonly items = {
      add: (file: File): void => {
        this._files.push(file);
      },
    };
    get files(): FileList {
      return this._files as unknown as FileList;
    }
  }
  globalThis.DataTransfer = DataTransferStub as unknown as typeof DataTransfer;
}

if (typeof globalThis.DragEvent === 'undefined') {
  class DragEventStub extends Event {
    readonly dataTransfer: DataTransfer | null;
    constructor(type: string, init: EventInit & { dataTransfer?: DataTransfer } = {}) {
      super(type, init);
      this.dataTransfer = init.dataTransfer ?? null;
    }
  }
  globalThis.DragEvent = DragEventStub as unknown as typeof DragEvent;
}
