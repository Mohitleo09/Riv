import { SetMetadata } from '@nestjs/common';

export type Role = 'USER' | 'ADMIN';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
