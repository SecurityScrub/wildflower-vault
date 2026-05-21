import { Client, Environment } from "square";
import { getSquareConfig } from "./settings";

let _client: Client | null = null;

export async function getSquareClient(): Promise<Client> {
  const config = await getSquareConfig();
  _client = new Client({
    accessToken: config.accessToken,
    environment:
      config.environment === "production" ? Environment.Production : Environment.Sandbox,
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

  const { result } = await client.ordersApi.createOrder({
    order: {
      locationId: config.locationId,
      lineItems: params.lineItems,
      referenceId: params.referenceId,
    },
    idempotencyKey: `order-${params.referenceId}-${Date.now()}`,
  });

  return result.order;
}

export async function createPaymentLink(params: {
  orderId: string;
  checkoutNote?: string;
  redirectUrl?: string;
}) {
  const client = await getSquareClient();
  const config = await getSquareConfig();

  const { result } = await client.checkoutApi.createPaymentLink({
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

  return result.paymentLink;
}

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookKey: string,
  url: string
): Promise<boolean> {
  const { WebhooksHelper } = await import("square");
  return WebhooksHelper.isValidWebhookEventSignature(body, signature, webhookKey, url);
}
