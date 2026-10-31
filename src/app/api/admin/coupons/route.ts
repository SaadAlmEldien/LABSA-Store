import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig } from '@/lib/server/env';
import type { DemoCoupon } from '@/data/coupons';

export async function GET() {
  const session = await getVerifiedServerAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Admin authentication required.' },
      { status: 401 }
    );
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data: dbCoupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const coupons: DemoCoupon[] = (dbCoupons || []).map((c) => ({
      id: c.id,
      code: c.code,
      title: { ar: c.title_ar, en: c.title_en },
      description: { ar: c.description_ar || '', en: c.description_en || '' },
      discountType: c.discount_type,
      discountValue: c.discount_value,
      minSubtotalEgp: c.min_subtotal_egp,
      maxDiscountEgp: c.max_discount_egp || undefined,
      startsAt: c.starts_at || undefined,
      expiresAt: c.expires_at || undefined,
      maxTotalUsesDemo: c.max_total_uses || undefined,
      usedCountDemo: c.used_count,
      status: c.status,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ ok: true, coupons });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    const { readAllDemoCoupons } = await import('@/data/coupons');
    return NextResponse.json({ ok: true, coupons: readAllDemoCoupons() });
  }

  return NextResponse.json({ ok: false, error: 'database_unavailable' }, { status: 503 });
}

export async function POST(request: Request) {
  const session = await getVerifiedServerAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Admin authentication required.' },
      { status: 401 }
    );
  }

  let body: Partial<DemoCoupon>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!body.code || !body.discountType || !body.discountValue) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();
  const code = body.code.trim().toUpperCase().slice(0, 32);

  if (supabase) {
    const couponId = body.id || `cpn-${crypto.randomUUID().slice(0, 10)}`;
    const { data, error } = await supabase.from('coupons').upsert({
      id: couponId,
      code,
      title_ar: body.title?.ar || code,
      title_en: body.title?.en || code,
      description_ar: body.description?.ar || null,
      description_en: body.description?.en || null,
      discount_type: body.discountType,
      discount_value: body.discountValue,
      min_subtotal_egp: body.minSubtotalEgp || 0,
      max_discount_egp: body.maxDiscountEgp || null,
      starts_at: body.startsAt || null,
      expires_at: body.expiresAt || null,
      max_total_uses: body.maxTotalUsesDemo || null,
      status: body.status || 'active',
      updated_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, coupon: data });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    const { readAllDemoCoupons, writeAllDemoCoupons } = await import('@/data/coupons');
    const all = readAllDemoCoupons();
    const couponToSave: DemoCoupon = {
      id: body.id || `cpn-${code.toLowerCase()}`,
      code,
      title: body.title || { ar: code, en: code },
      description: body.description || { ar: '', en: '' },
      discountType: body.discountType,
      discountValue: body.discountValue,
      minSubtotalEgp: body.minSubtotalEgp || 0,
      maxDiscountEgp: body.maxDiscountEgp,
      startsAt: body.startsAt,
      expiresAt: body.expiresAt,
      maxTotalUsesDemo: body.maxTotalUsesDemo,
      usedCountDemo: body.usedCountDemo || 0,
      status: body.status || 'active',
      createdAt: body.createdAt || new Date().toISOString(),
    };
    const exists = all.some((c) => c.id === couponToSave.id);
    const updated = exists
      ? all.map((c) => (c.id === couponToSave.id ? couponToSave : c))
      : [couponToSave, ...all];
    writeAllDemoCoupons(updated);
    return NextResponse.json({ ok: true, coupon: couponToSave });
  }

  return NextResponse.json({ ok: false, error: 'database_unavailable' }, { status: 503 });
}
