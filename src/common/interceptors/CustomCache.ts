import { CacheInterceptor, Injectable } from '@nestjs/common';

@Injectable()
export default class CustomHttpCacheInterceptor extends CacheInterceptor {
    httpServer: any;
    trackBy(context: any): string | undefined {
        const request = context.switchToHttp().getRequest();
        const isGetRequest = request.method === 'GET';
        const requestURl = request.path;
        const excludePaths = ['/me/api-key'];

        if (
            !isGetRequest ||
            (isGetRequest &&
                excludePaths.some((url) => requestURl.includes(url)))
        ) {
            return undefined;
        }
        return requestURl;
    }
}
