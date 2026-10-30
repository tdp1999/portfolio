import { unsavedChangesGuard } from '@portfolio/console/shared/ui';
import { medicineCabinetRoutes } from './medicine-cabinet.routes';

// 'P4 Hỏi bỏ thay đổi' of the medicine cabinet epic: every route of 'S2 Form sản phẩm' asks before it
// drops unsaved changes.
describe('medicineCabinetRoutes', () => {
  const route = (path: string) => medicineCabinetRoutes.find((r) => r.path === path);

  it.each(['new', ':id/edit'])('P4: route "%s" has unsavedChangesGuard', (path) => {
    expect(route(path)?.canDeactivate).toContain(unsavedChangesGuard);
  });

  it.each(['', 'people'])('has the route "%s"', (path) => {
    expect(route(path)).toBeDefined();
  });
});
