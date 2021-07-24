import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyAuthStrategy extends PassportStrategy(Strategy, 'api-key') {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: Logger
    ) {
        super(
            { header: 'SNAPSHOT_KEY', prefix: '' },
            true,
            async (key: string, done) => {
                return this.validate(key, done);
            }
        );
    }

    public validate = (key: string, done: (error: Error, data: any) => {}) => {
        this.logger.log('Validating api-key ', JSON.stringify({ key }));
        console.log('', { key });

        this.authService
            .findByApiKey(key)
            .then((result) => {
                this.logger.log(
                    'Done validating api-key',
                    JSON.stringify({ result })
                );
                console.log('', { result });

                if (result === true) {
                    done(null, true);
                }

                done(new UnauthorizedException(), null);
            })
            .catch((err) => {
                console.log('Failed to validate: ' + err);

                done(new UnauthorizedException(), null);
            });
    };
}
