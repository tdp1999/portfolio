import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiService, ERROR_HANDLER, SKIP_ERROR_HANDLING } from '@portfolio/console/shared/data-access';
import { catchError, Observable, throwError } from 'rxjs';
import type {
  HealthProfileDto,
  MedicalItemDto,
  MedicalItemPayload,
  MedicalItemsListResponse,
} from './medicine-cabinet.types';

const BASE = '/medicine-cabinet';

@Injectable({ providedIn: 'root' })
export class MedicineCabinetService {
  private readonly api = inject(ApiService);
  private readonly errorHandler = inject(ERROR_HANDLER, { optional: true });
  /** The global handler is skipped, then called again for every status but 404, which each page handles itself. */
  private readonly options = { context: new HttpContext().set(SKIP_ERROR_HANDLING, true) };

  listItems(params: { page: number; limit: number; profileId?: string }) {
    const queryParams: Record<string, string> = { page: String(params.page), limit: String(params.limit) };
    if (params.profileId) queryParams['profileId'] = params.profileId;
    return this.globalErrorsExcept404(
      this.api.get<MedicalItemsListResponse>(`${BASE}/items`, { ...this.options, params: queryParams })
    );
  }

  getItem(id: string) {
    return this.globalErrorsExcept404(this.api.get<MedicalItemDto>(`${BASE}/items/${id}`, this.options));
  }

  createItem(body: MedicalItemPayload) {
    return this.globalErrorsExcept404(this.api.post<{ id: string }>(`${BASE}/items`, body, this.options));
  }

  updateItem(id: string, body: MedicalItemPayload) {
    return this.globalErrorsExcept404(this.api.patch<{ success: boolean }>(`${BASE}/items/${id}`, body, this.options));
  }

  deleteItem(id: string) {
    return this.globalErrorsExcept404(this.api.delete<{ success: boolean }>(`${BASE}/items/${id}`, this.options));
  }

  listProfiles() {
    return this.globalErrorsExcept404(this.api.get<HealthProfileDto[]>(`${BASE}/profiles`, this.options));
  }

  createProfile(body: { name: string }) {
    return this.globalErrorsExcept404(this.api.post<{ id: string }>(`${BASE}/profiles`, body, this.options));
  }

  renameProfile(id: string, body: { name: string }) {
    return this.globalErrorsExcept404(
      this.api.patch<{ success: boolean }>(`${BASE}/profiles/${id}`, body, this.options)
    );
  }

  deleteProfile(id: string) {
    return this.globalErrorsExcept404(this.api.delete<{ success: boolean }>(`${BASE}/profiles/${id}`, this.options));
  }

  private globalErrorsExcept404<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 404) this.errorHandler?.handleHttpError(error);
        return throwError(() => error);
      })
    );
  }
}
