import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
    handleRequest<TUser = any>(
        err: any,
        user: any,
        _info: any,
        _context: ExecutionContext,
        _status?: any,
    ): TUser {
        // Return null instead of throwing UnauthorizedException if user is not found
        return (user || null) as TUser;
    }
}
