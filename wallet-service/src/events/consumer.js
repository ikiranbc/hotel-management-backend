const amqp = require('amqplib');
const walletService = require('../services/walletService');

const EXCHANGE_NAME = 'hotel_booking';
const QUEUE_NAME = 'wallet_payment_requests';
const ROUTING_KEY = 'booking.payment.requested';

const startConsumer = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`[*] Wallet Service consuming events from queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[x] Received payment request:`, content);

          await walletService.processPayment(content);

          channel.ack(msg);
        } catch (err) {
          console.error('Error processing booking payment request:', err);
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
