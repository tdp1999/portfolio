import { parsedFile } from '../__fixtures__/checklist.fixture';
import { ChecklistDoc } from './checklist-doc.entity';

describe('ChecklistDoc', () => {
  describe('resync()', () => {
    it('should return null when the markdown is unchanged and the doc is live', () => {
      const doc = ChecklistDoc.create(parsedFile());

      expect(doc.resync(parsedFile())).toBeNull();
    });

    it('should bring an archived doc back live when its file is pushed again unchanged', () => {
      const archived = ChecklistDoc.create(parsedFile()).archive();

      const revived = archived?.resync(parsedFile());

      expect(revived?.isArchived).toBe(false);
    });
  });

  describe('archive()', () => {
    it('should return null for a doc that is already archived', () => {
      const archived = ChecklistDoc.create(parsedFile()).archive();

      expect(archived?.isArchived).toBe(true);
      expect(archived?.archive()).toBeNull();
    });
  });
});
