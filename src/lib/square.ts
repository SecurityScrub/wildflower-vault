// Square integration. We only do one-time checkout (hosted payment links),
// no subscriptions, no webhooks — so the operator only needs to provide
// Application ID + Access Token + Environment. The location ID is
// auto-discovered against the Locations API and cached per access token.

import { SquareClient, SquareEnvironment } from "square";
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
