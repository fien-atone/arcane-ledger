import { createApp } from './app.js';

const { httpServer } = await createApp();

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🏰 Arcane Ledger API ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});
