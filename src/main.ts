import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as session from 'express-session';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle('Snapshots.tf API')
        .setDescription(
            "Rate limit is 60 requests / minute. By default snapshots.tf enqueues a few thousand items every so often, these items are gathered from backpack.tf's api. This means that we only enqueue items that have a price on backpack.tf, feel free to enqueue items yourself. WARPAINT SUPPORT IS NOT ADDED YET! All GET endpoints are cached for 15 seconds."
        )
        .setVersion('0.0.1')
        .setExternalDoc('Main Site', 'https://snapshots.tf')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, {
        customSiteTitle: 'Snapshots.tf Public API',
    });

    app.use(
        session({
            store: require('connect-mongo').create({
                mongoUrl: 'mongodb://localhost',
                mongoOptions: {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                },
            }),
            secret: ['SESION_SECRET_1', 'SESSION_SECRET_2'],
            resave: false,
            saveUninitialized: false,
        })
    );

    app.use(helmet());

    await app.listen(3000);

    console.log(`Listening on ${await app.getUrl()}`);
}
bootstrap();
