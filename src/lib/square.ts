// Square integration. We only do one-time hosted checkout (payment links) —
// no subscriptions. Webhooks are used so payment status flows back into our
// DB automatically; a refresh helper covers the case where the webhook is
// delayed or misconfigured.

import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { getSquareConfig } from "./settings";

let _client: SquareClient | null = null;
let _clientToken: string | null = null;

async function getSquareClient(): Promise<SquareClient> {
  const config = await getSquareConfig();
  // Rebuild the client only when the token changes so multiple bookings in a
  // row reuse the same instance.
  if (!_client || _clientToken !== config.accessToken) {
    _client = new SquareClient({
      token: config.accessToken,
      environment:
        config.environment === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
    _clientToken = config.accessToken;
  }
  return _client;
}

// Cache the resolved location ID per access token for the lifetime of the
// process. If the operator rotates the access token in admin settings, the
// key changes and we re-query.
const locationCache = new Map<string, string>();

async function getDefaultLocationId(): Promise<string> {
  const config = await getSquareConfig();
  if (config.locationId) return config.locationId;

  const cached = locationCache.get(config.accessToken);
  if (cached) return cached;

  const client = await getSquareClient();
  const res = await client.locations.list();
  const id = res.locations?.[0]?.id;
  if (!id) {
    throw new Error("Square: no locations available for this access token");
  }
  locationCache.set(config.accessToken, id);
  return id;
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
  const locationId = await getDefaultLocationId();

  const response = await client.orders.create({
    order: {
      locationId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lineItems: params.lineItems as any,
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
  const locationId = await getDefaultLocationId();

  const response = await client.checkout.paymentLinks.create({
    idempotencyKey: `link-${params.orderId}-${Date.now()}`,
    order: {
      locationId,
      referenceId: params.orderId,
    },
    checkoutOptions: {
      redirectUrl: params.redirectUrl,
      merchantSupportEmail: process.env.ADMIN_EMAIL,
    },
  });

  return response.paymentLink;
}

/** Verify the HMAC signature Square attaches to webhook deliveries. Returns
 * false (not throw) on any failure so the caller can respond 401. */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookKey: string,
  url: string,
): Promise<boolean> {
  try {
    return WebhooksHelper.verifySignature({
      requestBody: body,
      signatureHeader: signature,
      signatureKey: webhookKey,
      notificationUrl: url,
    });
  } catch {
    return false;
  }
}

/** Pull the latest payment state for a Square order: sum of completed
 * payments (in dollars) and whether the order's net total has been paid in
 * full. Used by the webhook handler and the admin "Refresh from Square"
 * button. Returns null if the order can't be fetched. */
export async function getSquareOrderPaymentSummary(
  orderId: string,
): Promise<{
  paidAmount: number;
  totalAmount: number;
  isFullyPaid: boolean;
  lastPaymentId: string | null;
} | null> {
  const client = await getSquareClient();
  try {
    const res = await client.orders.get({ orderId });
    const order = res.order;
    if (!order) return null;
    const totalCents = Number(order.totalMoney?.amount ?? 0);
    // Tenders represent each completed payment attached to the order.
    const tenders = order.tenders ?? [];
    let paidCents = 0;
    let lastPaymentId: string | null = null;
    for (const t of tenders) {
      const amt = Number(t.amountMoney?.amount ?? 0);
      paidCents += amt;
      if (t.paymentId) lastPaymentId = t.paymentId;
    }
    return {
      paidAmount: paidCents / 100,
      totalAmount: totalCents / 100,
      isFullyPaid: totalCents > 0 && paidCents >= totalCents,
      lastPaymentId,
    };
  } catch {
    return null;
  }
}
