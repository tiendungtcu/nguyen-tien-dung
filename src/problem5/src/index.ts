import path from 'path';
import { createApp } from './server';
import { ResourceStore } from './db';

const PORT = Number(process.env.PORT ?? 4000);
const dataFile = path.resolve(__dirname, '../data/resources.json');

const store = new ResourceStore(dataFile);

const start = async () => {
  await store.init();
  const app = createApp({ store });
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exitCode = 1;
});
