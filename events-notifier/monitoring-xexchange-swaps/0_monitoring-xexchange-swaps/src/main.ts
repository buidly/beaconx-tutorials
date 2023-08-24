import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { LoggerInitializer } from '@multiversx/sdk-nestjs-common';
import { ApiConfigModule, ApiConfigService } from './common/api-config';
import { EventsNotifierModule } from './events-notifier';

import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';

async function bootstrap() {
  const apiConfigApp = await NestFactory.create(ApiConfigModule);
  const apiConfigService = apiConfigApp.get<ApiConfigService>(ApiConfigService);

  if (apiConfigService.getIsEventsNotifierFeatureActive()) {
    const eventsNotifierApp = await NestFactory.create(EventsNotifierModule);
    await eventsNotifierApp.listen(apiConfigService.getEventsNotifierFeaturePort());
  }

  const logger = new Logger('Bootstrapper');

  LoggerInitializer.initialize(logger);

  logger.log(`Events Notifier active: ${apiConfigService.getIsEventsNotifierFeatureActive()}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
