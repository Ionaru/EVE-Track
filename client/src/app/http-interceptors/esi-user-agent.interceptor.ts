import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';

import { environment } from '../../environments/environment';

/**
 * Interceptor to set a custom User Agent header when communicating with the ESI, for transparency.
 */
@Injectable()
export class EsiUserAgentInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (request.url.includes(EVE.ESIURL)) {
            request = request.clone({
                setHeaders: {'X-User-Agent': `EVIE ${environment.VERSION}, by #Ionaru`},
            });
        }

        return next.handle(request);
    }
}
