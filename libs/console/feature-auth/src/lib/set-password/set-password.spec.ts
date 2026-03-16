import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { API_CONFIG } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import SetPasswordComponent from './set-password';

const VALID_TOKEN = 'a'.repeat(64);
const USER_ID = 'user-123';

function createRoute(token: string | null, userId: string | null) {
  const params = new Map<string, string>();
  if (token) params.set('token', token);
  if (userId) params.set('userId', userId);
  return {
    provide: ActivatedRoute,
    useValue: { snapshot: { queryParamMap: params } },
  };
}

describe('SetPasswordComponent', () => {
  let fixture: ComponentFixture<SetPasswordComponent>;
  let component: SetPasswordComponent;
  let httpTesting: HttpTestingController;
  let toastSpy: jest.SpyInstance;
  let routerSpy: jest.SpyInstance;

  function setup(token: string | null = VALID_TOKEN, userId: string | null = USER_ID) {
    TestBed.configureTestingModule({
      imports: [SetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: SetPasswordComponent }]),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:3000', urlPrefix: 'api', timeout: 5000 } },
        createRoute(token, userId),
      ],
    });

    fixture = TestBed.createComponent(SetPasswordComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    toastSpy = jest.spyOn(TestBed.inject(ToastService), 'success');
    routerSpy = jest.spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.detectChanges();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create with valid params', () => {
    setup();
    expect(component).toBeTruthy();
    expect(component.tokenError()).toBe(false);
  });

  it('should show token error when token is missing', () => {
    setup(null, USER_ID);
    expect(component.tokenError()).toBe(true);
  });

  it('should show token error when userId is missing', () => {
    setup(VALID_TOKEN, null);
    expect(component.tokenError()).toBe(true);
  });

  it('should show token error when token format is invalid', () => {
    setup('invalid-token', USER_ID);
    expect(component.tokenError()).toBe(true);
  });

  it('should not submit when form is empty', () => {
    setup();
    component.onSubmit();
    httpTesting.expectNone({ method: 'POST' });
  });

  it('should not submit when passwords do not match', () => {
    setup();
    component.form.controls.password.setValue('Password1!');
    component.form.controls.confirmPassword.setValue('Different1!');
    component.onSubmit();
    httpTesting.expectNone({ method: 'POST' });
  });

  it('should submit and show success toast on valid form', () => {
    setup();
    component.form.controls.password.setValue('Password1!');
    component.form.controls.confirmPassword.setValue('Password1!');
    component.onSubmit();

    const req = httpTesting.expectOne({ method: 'POST', url: 'http://localhost:3000/api/auth/set-password' });
    expect(req.request.body).toEqual({
      token: VALID_TOKEN,
      userId: USER_ID,
      newPassword: 'Password1!',
    });

    req.flush({ success: true });
    expect(toastSpy).toHaveBeenCalledWith('Password set successfully. You can now log in.');
    expect(routerSpy).toHaveBeenCalledWith('/auth/login');
  });

  it('should toggle password visibility', () => {
    setup();
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });

  it('should set submitting signal during request', () => {
    setup();
    component.form.controls.password.setValue('Password1!');
    component.form.controls.confirmPassword.setValue('Password1!');
    component.onSubmit();

    expect(component.submitting()).toBe(true);

    const req = httpTesting.expectOne({ method: 'POST' });
    req.flush({ success: true });

    expect(component.submitting()).toBe(false);
  });
});
