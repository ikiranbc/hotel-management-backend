const amqp = require('amqplib');

const EXCHANGE_NAME = 'hotel_booking';
let channel = null;

const initPublisher = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('✅ RabbitMQ Publisher initialized in Wallet Service');
  } catch (err) {
    console.error('Failed to initialize RabbitMQ publisher in Wallet Service:', err);
  }
};

const publishEvent = async (routingKey, data) => {
  if (!channel) {
    console.warn(`Publisher channel not ready. Re-initializing...`);
    await initPublisher();
    if (!channel) {
      throw new Error('Message broker connection is unavailable');
    }
  }
  const payload = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE_NAME, routingKey, payload, { persistent: true });
  console.log(`[x] Published wallet event to routing key '${routingKey}':`, data);
};

module.exports = { initPublisher, publishEvent };
