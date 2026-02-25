import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const cookieValue = request.cookies?.[CSRF_COOKIE_NAME];
    const headerValue = request.headers[CSRF_HEADER_NAME];

    if (!headerValue) {
      throw new ForbiddenException('Missing CSRF token header');
    }

    if (!cookieValue) {
      throw new ForbiddenException('Missing CSRF token cookie');
    }

    if (headerValue !== cookieValue) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}
