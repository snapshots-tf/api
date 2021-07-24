import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyAuthStrategy extends PassportStrategy(Strategy, 'api-key') {
    private readonly logger = new Logger(ApiKeyAuthStrategy.name);

    constructor(private readonly authService: AuthService) {
        super(
            { header: 'X-SNAPSHOT-KEY', prefix: '' },
            true,
            async (key: string, done) => {
                return this.validate(key, done);
            }
        );
    }

    public validate = (key: string, done: (error: Error, data: any) => {}) => {
        this.logger.log('Validating ' + key);

        this.authService
            .findByApiKey(key)
            .then((result) => {
                this.logger.log('Result: ' + result);

                if (result === true) {
                    done(null, true);
                }

                done(new UnauthorizedException(), null);
            })
            .catch((err) => {
                this.logger.log('Failed:', err);

                done(new UnauthorizedException(), null);
            });
    };
}
