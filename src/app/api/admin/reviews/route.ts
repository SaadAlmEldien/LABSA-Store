import { NextResponse } from 'next/server';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig } from '@/lib/server/env';
import type { ProductReview, ReviewModerationStatus } from '@/data/reviews';

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
    const { data: dbReviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const reviews: ProductReview[] = (dbReviews || []).map((r) => ({
      id: r.id,
      productId: r.product_id,
      productSlug: r.product_slug,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      reviewerName: r.reviewer_name,
      orderNumberReference: r.order_number_reference || undefined,
      isVerifiedDeliveredPurchase: r.is_verified_delivered_purchase,
      isDemoSample: r.is_demo_sample,
      status: r.status,
      createdAt: r.created_at,
      moderatedAt: r.moderated_at || undefined,
      moderatedBy: r.moderated_by || undefined,
      privateModerationNote: r.private_moderation_note || undefined,
    }));

    return NextResponse.json({ ok: true, reviews });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    const { readAllDemoReviews } = await import('@/data/reviews');
    return NextResponse.json({ ok: true, reviews: readAllDemoReviews() });
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

  let body: {
    reviewId: string;
    newStatus: ReviewModerationStatus;
    privateNote?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!body.reviewId || !body.newStatus) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  if (body.newStatus !== 'approved' && body.newStatus !== 'rejected') {
    return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        status: body.newStatus,
        moderated_at: nowIso,
        moderated_by: session.actorIdentity,
        private_moderation_note: body.privateNote ? body.privateNote.trim().slice(0, 500) : null,
      })
      .eq('id', body.reviewId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, review: data });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    const { adminModerateReview } = await import('@/data/reviews');
    const success = adminModerateReview({
      reviewId: body.reviewId,
      newStatus: body.newStatus,
      privateModerationNote: body.privateNote,
      actorIdentity: session.actorIdentity,
      timestamp: nowIso,
    });
    if (!success) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'database_unavailable' }, { status: 503 });
}
