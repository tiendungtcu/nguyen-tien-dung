import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ResourceStore } from './db';
import { HttpError } from './errors';
import { parseCreatePayload, parseUpdatePayload, parseFilters } from './validators';
import { openApiDocument } from './openapi';

interface CreateAppOptions {
  store: ResourceStore;
}

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (handler: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
};

export const createApp = ({ store }: CreateAppOptions) => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(openApiDocument);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get(
    '/api/resources',
    asyncHandler(async (req, res) => {
      const filters = parseFilters(req.query as Record<string, unknown>);
      const data = await store.list(filters);
      res.json({ data });
    })
  );

  app.post(
    '/api/resources',
    asyncHandler(async (req, res) => {
      const payload = parseCreatePayload(req.body);
      const resource = await store.insert(payload);
      res.status(201).json({ data: resource });
    })
  );

  app.get(
    '/api/resources/:id',
    asyncHandler(async (req, res) => {
      const resource = await store.findById(req.params.id);
      if (!resource) {
        throw new HttpError(404, 'Resource not found');
      }
      res.json({ data: resource });
    })
  );

  app.put(
    '/api/resources/:id',
    asyncHandler(async (req, res) => {
      const payload = parseUpdatePayload(req.body);
      const updated = await store.update(req.params.id, payload);
      if (!updated) {
        throw new HttpError(404, 'Resource not found');
      }
      res.json({ data: updated });
    })
  );

  app.delete(
    '/api/resources/:id',
    asyncHandler(async (req, res) => {
      const removed = await store.remove(req.params.id);
      if (!removed) {
        throw new HttpError(404, 'Resource not found');
      }
      res.status(204).send();
    })
  );

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, 'Route not found'));
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const err = error instanceof HttpError ? error : new HttpError(500, 'Unexpected error');
    if (!(error instanceof HttpError)) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    res.status(err.statusCode).json({ error: err.message });
  });

  return app;
};
