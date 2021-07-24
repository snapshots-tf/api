import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyAuthStrategy extends PassportStrategy(Strategy, 'api-key') {
    private readonly logger = new Logger('ApiKeyAuthStrategy');

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
        this.logger.debug('Validating ' + key);

        this.authService
            .findByApiKey(key)
            .then((result) => {
                this.logger.debug('Result: ' + result);

                if (result === true) {
                    done(null, true);
                }

                done(new UnauthorizedException(), null);
            })
            .catch((err) => {
                this.logger.error('Failed:', err);

                done(new UnauthorizedException(), null);
            });
    };
}
