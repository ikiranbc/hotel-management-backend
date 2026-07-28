const amqp = require('amqplib');
const walletService = require('../services/walletService');

const EXCHANGE_NAME = 'hotel_booking';
const QUEUE_NAME = 'wallet_payment_requests';

const startConsumer = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'booking.#');

    console.log(`[*] Wallet Service consuming events from queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const routingKey = msg.fields.routingKey;
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[x] Received event on key '${routingKey}':`, content);

          if (routingKey === 'booking.payment.requested') {
            await walletService.processPayment(content);
          } else if (routingKey === 'booking.refund.requested') {
            await walletService.processRefund(content);
          }

          channel.ack(msg);
        } catch (err) {
          console.error(`Error processing event on key ${routingKey}:`, err);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (err) {
    console.error('Failed to start Wallet Service consumer:', err);
    throw err;
  }
};

module.exports = { startConsumer };
