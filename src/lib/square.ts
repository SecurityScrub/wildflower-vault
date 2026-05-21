import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { getSquareConfig } from "./settings";

let _client: SquareClient | null = null;

export async function getSquareClient(): Promise<SquareClient> {
  const config = await getSquareConfig();
  _client = new SquareClient({
    token: config.accessToken,
    environment:
      config.environment === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
  return _client;
}

export async function createSquareOrder(params: {
  lineItems: Array<{
    name: string;
    quantity: string;
    basePriceMoney: { amount: bigint; currency: string };
  }>;
  referenceId: string;
}) {
  const client = await getSquareClient();
  const config = await getSquareConfig();

  const response = await client.orders.create({
    order: {
      locationId: config.locationId,
      lineItems: params.lineItems,
      referenceId: params.referenceId,
    },
    idempotencyKey: `order-${params.referenceId}-${Date.now()}`,
  });

  return response.order;
}

export async function createPaymentLink(params: {
  orderId: string;
  checkoutNote?: string;
  redirectUrl?: string;
}) {
  const client = await getSquareClient();
  const config = await getSquareConfig();

  const response = await client.checkout.createPaymentLink({
    idempotencyKey: `link-${params.orderId}-${Date.now()}`,
    order: {
      locationId: config.locationId,
      referenceId: params.orderId,
    },
    checkoutOptions: {
      redirectUrl: params.redirectUrl,
      merchantSupportEmail: process.env.ADMIN_EMAIL,
    },
  });

  return response.paymentLink;
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookKey: string,
  url: string
): boolean {
  return WebhooksHelper.isValidWebhookEventSignature(body, signature, webhookKey, url);
}
