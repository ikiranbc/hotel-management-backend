const amqp = require('amqplib');
const hotelService = require('../services/hotelService');

const EXCHANGE_NAME = 'hotel_booking';
const QUEUE_NAME = 'hotel_room_updates';
const ROUTING_KEY = 'room.status.update';

const startConsumer = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await conn.createChannel();

    // Ensure exchange exists
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Assert a queue that is persistent
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue to exchange with the specific routing key
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`[*] Hotel Service consuming events from queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[x] Received room update event:`, content);

          const { roomId, isAvailable } = content;
          if (roomId !== undefined && isAvailable !== undefined) {
            await hotelService.markRoomAvailability(roomId, isAvailable);
            console.log(`[x] Updated room ${roomId} availability to ${isAvailable}`);
          }

          channel.ack(msg); // Acknowledge message processed successfully
        } catch (err) {
          console.error('Error processing event message:', err);
          // Requeue message if transient issue, otherwise discard
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (err) {
    console.error('Failed to start RabbitMQ consumer:', err);
    throw err;
  }
};

module.exports = { startConsumer };
