import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequireAuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const session = request.session as {
            user: { steamID64: string } | undefined;
        };

        if (session?.user?.steamID64 === undefined) {
            throw new UnauthorizedException();
        }

        return true;
    }
}
