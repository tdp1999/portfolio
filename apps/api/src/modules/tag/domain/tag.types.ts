import { IBaseAuditProps } from '@portfolio/shared/types';

export interface ITagProps extends IBaseAuditProps {
  name: string;
  slug: string;
}

export interface ICreateTagPayload {
  name: string;
}

export interface IUpdateTagPayload {
  name: string;
}
