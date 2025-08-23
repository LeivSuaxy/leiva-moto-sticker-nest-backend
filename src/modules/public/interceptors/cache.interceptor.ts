import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache, CacheTTL } from '@nestjs/cache-manager';
import { CacheTime } from 'src/common/enums/cacheTimes.enum';

@Injectable()
export class CacheInterceptorMod implements NestInterceptor {
    private excludedPaths: string[] = [

    ];

    constructor(
        @Inject(Cache)
        private cacheManager: Cache
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        if (!request.url.startsWith('/public')) {
            return next.handle();
        }

        if (request.method !== 'GET') {
            return next.handle();
        }

        const currentPath = request.url.split('?')[0];
        if (this.excludedPaths.some(path => currentPath.startsWith(path))) {
            return next.handle();
        }

        const cacheKey = `${request.url}${JSON.stringify(request.query)}`;

        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            console.log(`Cached! ${cacheKey}`);
            return of(cachedData);
        }

        let ttl = CacheTime.SIX_HOUR;

        return next.handle().pipe(
            tap(async (responseData) => {
                if (responseData) {
                    await this.cacheManager.set(cacheKey, responseData, ttl);
                }
            })
        );
    }



}