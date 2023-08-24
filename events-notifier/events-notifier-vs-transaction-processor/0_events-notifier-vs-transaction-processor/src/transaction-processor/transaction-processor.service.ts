import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Lock } from "@multiversx/sdk-nestjs-common";
import { TransactionProcessor } from "@multiversx/sdk-transaction-processor";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class TransactionProcessorService {
  private readonly transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
  ) { }

  @Cron(CronExpression.EVERY_SECOND)
  @Lock()
  async handleNewTransactions() {
    await this.transactionProcessor.start({
      gatewayUrl: this.apiConfigService.getApiUrl(),
      maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
      onTransactionsReceived: async (_shardId, _nonce, _transactions) => {
        // TODO: implement
      },
      getLastProcessedNonce: async (shardId) => {
        return await this.cacheService.getRemote(CacheInfo.LastProcessedNonce(shardId).key);
      },
      setLastProcessedNonce: async (shardId, nonce) => {
        await this.cacheService.setRemote(CacheInfo.LastProcessedNonce(shardId).key, nonce, CacheInfo.LastProcessedNonce(shardId).ttl);
      },
    });
  }
}
