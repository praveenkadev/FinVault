import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { KafkaTransactionEvent, Transaction } from '../types';
import { logger } from '../config/logger';
import AuditLog from '../models/audit-log.model';

const kafka = new Kafka({
  clientId: 'finvault-backend',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: { initialRetryTime: 300, retries: 10 },
});

let producer: Producer;
let consumer: Consumer;

// ── Producer ──────────────────────────────────────────────
export const initKafkaProducer = async (): Promise<void> => {
  producer = kafka.producer();
  await producer.connect();
  logger.info('✅ Kafka producer connected');
};

export const publishTransactionEvent = async (
  type: KafkaTransactionEvent['type'],
  transaction: Transaction
): Promise<void> => {
  const event: KafkaTransactionEvent = {
    eventId: uuidv4(),
    type,
    payload: transaction,
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: 'transaction-events',
    messages: [
      {
        key: transaction.userId,
        value: JSON.stringify(event),
      },
    ],
  });

  logger.debug(`Kafka event published: ${type} for tx ${transaction.id}`);
};

// ── Consumer ──────────────────────────────────────────────
export const initKafkaConsumer = async (): Promise<void> => {
  consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || 'finvault-consumers',
  });

  await consumer.connect();
  await consumer.subscribe({ topic: 'transaction-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      if (!message.value) return;

      try {
        const event: KafkaTransactionEvent = JSON.parse(message.value.toString());
        logger.debug(`Kafka message received: ${event.type} [${topic}:${partition}]`);

        // Write audit log to MongoDB
        await AuditLog.create({
          eventId: event.eventId,
          eventType: event.type,
          userId: event.payload.userId,
          transactionId: event.payload.id,
          amount: event.payload.amount,
          status: event.payload.status,
          metadata: event.payload,
          timestamp: new Date(event.timestamp),
        });

        // Fraud detection — simple rule: flag transactions > $10,000
        if (
          event.type === 'TRANSACTION_CREATED' &&
          event.payload.amount > 10000
        ) {
          logger.warn(`🚨 High-value transaction flagged: $${event.payload.amount} (tx: ${event.payload.id})`);
          await publishTransactionEvent('FRAUD_FLAGGED', {
            ...event.payload,
            status: 'flagged',
          });
        }
      } catch (err) {
        logger.error('Kafka message processing error', err);
      }
    },
  });

  logger.info('✅ Kafka consumer listening on [transaction-events]');
};

export const disconnectKafka = async (): Promise<void> => {
  await producer?.disconnect();
  await consumer?.disconnect();
};
