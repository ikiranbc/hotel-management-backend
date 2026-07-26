require('dotenv').config();
const app = require('./app');
const { startConsumer } = require('./events/consumer');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Hotel Service is running on port ${PORT}`);

  // Adding a 5 seconds delay before launching consumers to ensure RabbitMQ is fully ready
  setTimeout(() => {
    startConsumer().catch((err) => {
      console.error('Fatal error starting RabbitMQ consumer:', err);
    });
  }, 5000);
});
