import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyAuthStrategy extends PassportStrategy(Strategy, 'api-key') {
    constructor(private readonly authService: AuthService) {
        super(
            { header: 'SNAPSHOT_KEY', prefix: '' },
            true,
            async (key: string, done) => {
                return this.validate(key, done);
            }
        );
    }

    public validate = (key: string, done: (error: Error, data: any) => {}) => {
        this.authService
            .findByApiKey(key)
            .then((result) => {
                if (result === true) {
                    done(null, true);
                }

                done(new UnauthorizedException(), null);
            })
            .catch(() => {
                done(new UnauthorizedException(), null);
            });
    };
}
