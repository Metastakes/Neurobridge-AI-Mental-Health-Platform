import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Roles Decorator
 * Specify which user roles can access a route
 *
 * Usage:
 * @Roles(UserRole.ADMIN, UserRole.PROVIDER)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
