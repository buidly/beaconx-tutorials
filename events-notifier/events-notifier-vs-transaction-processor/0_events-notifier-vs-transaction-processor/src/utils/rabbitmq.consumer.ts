import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
 */
export const CompetingRabbitConsumer = (config: {
  queueName: string;
  exchange?: string;
  deadLetterExchange?: string;
}) => {
  return applyDecorators(
    RabbitSubscribe({
      queue: config.queueName,
      exchange: config.exchange,
      routingKey: '',
      createQueueIfNotExists: false,
      queueOptions: {
        autoDelete: false,
        durable: true,
        arguments: {
          'x-single-active-consumer': true,
          'x-message-ttl': 300000,
          'x-queue-type': 'classic',
          'x-queue-mode': 'lazy',
        },
        deadLetterExchange: config.deadLetterExchange,
      },
    }),
  );
};
