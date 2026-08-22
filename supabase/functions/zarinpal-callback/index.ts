import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const merchantId = Deno.env.get('ZARINPAL_MERCHANT_ID') ?? '';
const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'http://localhost:5173/';
const sandbox = (Deno.env.get('ZARINPAL_SANDBOX') ?? 'true').toLowerCase() === 'true';
const gatewayHost = sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function redirect(result: 'success' | 'cancelled' | 'failed', orderId: string | null, refId?: string) {
  const url = new URL(publicSiteUrl);
  url.searchParams.set('payment', 'zarinpal');
  url.searchParams.set('result', result);
  if (orderId) url.searchParams.set('order_id', orderId);
  if (refId) url.searchParams.set('ref_id', refId);
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (request) => {
  if (!supabaseUrl || !serviceRoleKey || !merchantId) {
    return new Response('Payment service is not configured', { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const status = params.get('Status');
  const authority = params.get('Authority');
  const orderId = params.get('order_id');
  if (!orderId) return redirect('failed', null);
  if (status !== 'OK' || !authority) return redirect('cancelled', orderId);

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('id, total, status, payment_authority')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError || !order || order.payment_authority !== authority) {
    return redirect('failed', orderId);
  }

  if (order.status === 'paid') return redirect('success', orderId);

  const verifyResponse = await fetch(`${gatewayHost}/pg/v4/payment/verify.json`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: Number(order.total),
      currency: 'IRT',
      authority,
    }),
  });
  const verifyPayload = await verifyResponse.json().catch(() => null);
  const code = verifyPayload?.data?.code;
  const refId = verifyPayload?.data?.ref_id ? String(verifyPayload.data.ref_id) : undefined;
  const verified = code === 100 || code === 101;

  if (!verified) {
    await adminClient.from('orders').update({ status: 'failed', payment_error: `zarinpal:${code ?? 'unknown'}` }).eq('id', order.id).eq('status', 'pending');
    return redirect('failed', order.id);
  }

  const { data: markedOrder, error: updateError } = await adminClient
    .from('orders')
    .update({
      status: 'paid',
      payment_ref_id: refId ?? null,
      payment_verified_at: new Date().toISOString(),
      payment_error: null,
    })
    .eq('id', order.id)
    .in('status', ['pending', 'paid'])
    .select('id')
    .maybeSingle();

  if (updateError || !markedOrder) return redirect('failed', order.id);
  return redirect('success', order.id, refId);
});
