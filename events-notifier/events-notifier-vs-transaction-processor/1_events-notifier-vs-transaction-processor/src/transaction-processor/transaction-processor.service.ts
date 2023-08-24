
import { SwapEvent } from "@multiversx/sdk-exchange";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { TransactionProcessor } from "@multiversx/sdk-transaction-processor";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class TransactionProcessorService {
  private readonly logger = new OriginLogger(TransactionProcessorService.name);
  private readonly transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
    private readonly apiService: ApiService
  ) { }

  @Cron(CronExpression.EVERY_SECOND)
  @Lock()
  async handleNewTransactions() {
    await this.transactionProcessor.start({
      gatewayUrl: this.apiConfigService.getApiUrl(),
      maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
      onTransactionsReceived: async (_shardId, _nonce, transactions) => {
        const exchangeTransactions = transactions
          .filter((transaction) => transaction.receiver === 'erd1qqqqqqqqqqqqqpgquu5rsa4ee6l4azz6vdu4hjp8z4p6tt8m0n4suht3dy')
          .filter((transaction) => transaction.status === 'success')
          .filter((transaction) => transaction.getDataFunctionName() === 'swapTokensFixedInput' || transaction.getDataFunctionName() === 'swapTokensFixedOutput');

        for (const transaction of exchangeTransactions) {
          const { data: transactionDetails } = await this.apiService.get(`${this.apiConfigService.getApiUrl()}/transactions/${transaction.originalTransactionHash}`);

          const swapEventRaw = transactionDetails.logs.events.find((event: any) => event.identifier === 'swapTokensFixedInput' || event.identifier === 'swapTokensFixedOutput');
          const swapEvent = new SwapEvent(swapEventRaw).toJSON();

          this.logger.log(`Address ${swapEvent.caller} swapped ${swapEvent.tokenIn?.amount} ${swapEvent.tokenIn?.tokenID} for ${swapEvent.tokenOut?.amount} ${swapEvent.tokenOut?.tokenID}`);
        }
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
