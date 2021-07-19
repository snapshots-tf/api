import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import * as session from 'express-session';

import customCss from './lib/customCss';

const port = process.env.PORT || 3000;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: true,
        /*[
            'http://localhost:3000',
            'https://snapshots.tf',
            'https://app.snapshots.tf/',
        ],*/
        credentials: true,
    });

    const config = new DocumentBuilder()
        .setTitle('Snapshots.tf API')
        .setDescription(
            "Rate limit is 60 requests / minute. By default snapshots.tf enqueues a few thousand items every so often, these items are gathered from backpack.tf's api, this means that we only enqueue items that have a price on backpack.tf, feel free to enqueue items yourself. WARPAINT SUPPORT IS NOT ADDED YET! All GET endpoints are cached for 15 seconds."
        )
        .setVersion('0.0.1')
        .setExternalDoc('Main Site', 'https://snapshots.tf')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, {
        customSiteTitle: 'Snapshots.tf Public API',
        customCss,
    });

    app.use(
        session({
            store: require('connect-mongo').create({
                mongoUrl: 'mongodb://localhost/snapshots',
                mongoOptions: {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                },
            }),
            name: 'snapshots.tf',
            secret: ['Ic7n93JBY7vx', 'Tm33RN1WTTnM', 'u2Q8Q2jjJEPb'],
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'true',
                maxAge: 1209600000,
            },
        })
    );

    app.use(helmet());
    app.use(cookieParser(['Ic7n93JBY7vx', 'Tm33RN1WTTnM', 'u2Q8Q2jjJEPb']));

    await app.listen(port);

    console.log(`Listening on ${await app.getUrl()}`);
}
bootstrap();
