import { Injectable } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { CompetingRabbitConsumer } from 'src/utils';
import { SwapEvent } from '@multiversx/sdk-exchange';

@Injectable()
export class EventsNotifierConsumerService {
  private readonly logger = new OriginLogger(EventsNotifierConsumerService.name);

  @CompetingRabbitConsumer({
    queueName: 'events-98924f1f',
  })
  consumeEvents(rawEvents: any) {
    try {
      const events: any[] = rawEvents?.events ?? [];
      const exchangeEvents = events
        .filter((event) => event.address === 'erd1qqqqqqqqqqqqqpgquu5rsa4ee6l4azz6vdu4hjp8z4p6tt8m0n4suht3dy')
        .filter((event) => event.identifier === 'swapTokensFixedInput' || event.identifier === 'swapTokensFixedOutput');

      for (const event of exchangeEvents) {
        const swapEvent = new SwapEvent(event).toJSON();

        this.logger.log(`Address ${swapEvent.caller} swapped ${swapEvent.tokenIn?.amount} ${swapEvent.tokenIn?.tokenID} for ${swapEvent.tokenOut?.amount} ${swapEvent.tokenOut?.tokenID}`);
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when consuming events: ${JSON.stringify(rawEvents)}`);
      this.logger.error(error);
    }
  }
}
