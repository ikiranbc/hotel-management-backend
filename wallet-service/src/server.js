require('dotenv').config();
const app = require('./app');
const { initPublisher } = require('./events/publisher');
const { startConsumer } = require('./events/consumer');

const PORT = process.env.PORT || 3004;

app.listen(PORT, async () => {
  console.log(`Wallet Service is running on port ${PORT}`);

  // Allow RabbitMQ Broker 5 seconds to load up before establishing connections
  setTimeout(async () => {
    try {
      await initPublisher();
      await startConsumer();
    } catch (err) {
      console.error('Fatal initialization error in Wallet Service broker integrations:', err);
    }
  }, 5000);
});
