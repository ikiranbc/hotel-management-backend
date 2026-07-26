const amqp = require('amqplib');
const bookingService = require('../services/bookingService');

const EXCHANGE_NAME = 'hotel_booking';
const QUEUE_NAME = 'booking_payment_results';

const startConsumer = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind to all payment status keys: payment.success, payment.failed
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'payment.#');

    console.log(`[*] Booking Service consuming events from queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const routingKey = msg.fields.routingKey;
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[x] Received payment result on key '${routingKey}':`, content);

          const { bookingId, roomId, userId } = content;

          if (routingKey === 'payment.success') {
            await bookingService.confirmBooking(bookingId, roomId, userId);
            console.log(`[x] Booking ${bookingId} confirmed successfully.`);
          } else if (routingKey === 'payment.failed') {
            await bookingService.failBooking(bookingId, userId);
            console.log(`[x] Booking ${bookingId} cancelled due to payment failure.`);
          }

          channel.ack(msg);
        } catch (err) {
          console.error('Error processing payment result event:', err);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (err) {
    console.error('Failed to start Booking Service consumer:', err);
    throw err;
  }
};

module.exports = { startConsumer };
