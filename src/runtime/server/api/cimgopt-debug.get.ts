import { createError, defineEventHandler, setHeaders } from 'h3';
import { Service } from '../service/service';

export default defineEventHandler(async (event) => {
    const service = event.context.service;

    if (!service || !(service instanceof Service)) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Cache service not found',
        });
    }

    setHeaders(event, {
        'Cache-Control': `no-cache`,
    });
    return service.getDebugInfo();
});
