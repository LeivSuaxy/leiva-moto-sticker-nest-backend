import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TransformJsonInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.body) {
            // Transformar prices de JSON string a objeto
            if (request.body.prices && typeof request.body.prices === 'string') {
                try {
                    request.body.prices = JSON.parse(request.body.prices);
                    console.log('✅ Prices parsed successfully:', request.body.prices);
                } catch (error) {
                    console.error('❌ Error parsing prices JSON:', error);
                    request.body.prices = {};
                }
            }

            // Transformar tags de JSON string a array
            if (request.body.tags && typeof request.body.tags === 'string') {
                try {
                    request.body.tags = JSON.parse(request.body.tags);
                    console.log('✅ Tags parsed successfully:', request.body.tags);
                } catch (error) {
                    console.error('❌ Error parsing tags JSON:', error);
                    request.body.tags = [];
                }
            }

            console.log('🔍 Request body after transformation:', request.body);
        }

        return next.handle();
    }
}
