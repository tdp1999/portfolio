import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AuthGate, SessionBar, SignInForm, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-auth-gate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthGate, SessionBar, SignInForm, DdlDocPage, DdlSection],
  templateUrl: './ddl-auth-gate.html',
})
export class DdlAuthGate {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'sign-in-form', title: 'Sign-in form', level: 2 },
    { id: 'gate', title: 'Gate', level: 2 },
    { id: 'session-bar', title: 'Session bar', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly routeSnippet = `// pages/private/private.routes.ts: one entry per private page
export const PRIVATE_ROUTES: Route[] = [
  { path: 'checklist', loadChildren: () => import('@portfolio/landing/feature-checklist').then((m) => m.CHECKLIST_ROUTES) },
];`;

  protected readonly gateSnippet = `<landing-auth-gate
  [status]="auth.status()"
  [submitting]="auth.isSubmitting()"
  [error]="auth.signInError()"
  (signIn)="auth.signIn($event)"
>
  <ng-template><router-outlet /></ng-template>
</landing-auth-gate>`;
}
