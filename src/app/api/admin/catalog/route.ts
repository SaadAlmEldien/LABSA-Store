import { NextResponse } from 'next/server';
import { getVerifiedServerAdminSession } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/server/supabase';
import { getServerDatabaseConfig } from '@/lib/server/env';
import type { CatalogProduct, ProductStatus } from '@/data/catalog';

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
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*')
      .order('featured_rank', { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { data: dbVariants } = await supabase.from('product_variants').select('*');
    const variantsByProductId = new Map<string, any[]>();
    for (const v of dbVariants || []) {
      const arr = variantsByProductId.get(v.product_id) || [];
      arr.push({
        id: v.id,
        sku: v.sku,
        colorKey: v.color_key,
        size: v.size,
        stock: v.stock,
      });
      variantsByProductId.set(v.product_id, arr);
    }

    const products: CatalogProduct[] = (dbProducts || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      audience: p.audience,
      category: p.category,
      title: { ar: p.title_ar, en: p.title_en },
      shortDescription: { ar: p.short_description_ar, en: p.short_description_en },
      description: { ar: p.description_ar, en: p.description_en },
      priceEgp: p.price_egp,
      previousPriceEgp: p.previous_price_egp || undefined,
      status: p.status,
      isNew: p.is_new,
      isFeatured: p.is_featured,
      featuredRank: p.featured_rank,
      colors: p.colors || [],
      sizes: p.sizes || [],
      images: p.images || [],
      details: p.details || {},
      createdAt: p.created_at || new Date().toISOString(),
      variants: variantsByProductId.get(p.id) || [],
    }));

    return NextResponse.json({ ok: true, products });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    const { getAllCatalogProducts } = await import('@/data/catalog');
    return NextResponse.json({ ok: true, products: getAllCatalogProducts() });
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
    action: 'save' | 'toggle_archive';
    product?: CatalogProduct;
    productId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const dbConfig = getServerDatabaseConfig();
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  if (supabase) {
    if (body.action === 'toggle_archive' && body.productId) {
      const { data: p } = await supabase
        .from('products')
        .select('status')
        .eq('id', body.productId)
        .single();

      if (!p) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      const nextStatus = p.status === 'draft' ? 'active' : 'draft';

      await supabase.from('products').update({ status: nextStatus, updated_at: nowIso }).eq('id', body.productId);
      return NextResponse.json({ ok: true, status: nextStatus });
    }

    if (body.action === 'save' && body.product) {
      const p = body.product;
      const { error: prodErr } = await supabase.from('products').upsert({
        id: p.id,
        slug: p.slug,
        audience: p.audience,
        category: p.category,
        title_ar: p.title.ar,
        title_en: p.title.en,
        short_description_ar: p.shortDescription.ar,
        short_description_en: p.shortDescription.en,
        description_ar: p.description.ar,
        description_en: p.description.en,
        price_egp: p.priceEgp,
        previous_price_egp: p.previousPriceEgp || null,
        status: p.status,
        is_new: p.isNew,
        is_featured: p.isFeatured,
        featured_rank: p.featuredRank,
        colors: p.colors,
        sizes: p.sizes,
        images: p.images,
        details: p.details,
        updated_at: nowIso,
      });

      if (prodErr) {
        return NextResponse.json({ ok: false, error: prodErr.message }, { status: 500 });
      }

      for (const v of p.variants) {
        await supabase.from('product_variants').upsert({
          id: v.id,
          product_id: p.id,
          sku: v.sku,
          color_key: v.colorKey,
          size: v.size,
          stock: v.stock,
          updated_at: nowIso,
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }

  if (dbConfig.canUseLocalDemoFallback) {
    if (body.action === 'toggle_archive' && body.productId) {
      const { getAllCatalogProducts, writeCatalogProducts } = await import('@/data/catalog');
      const all = getAllCatalogProducts();
      const target = all.find((p) => p.id === body.productId);
      if (!target) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      const nextStatus: ProductStatus = target.status === 'draft' ? 'active' : 'draft';
      const updated: CatalogProduct[] = all.map((p) => (p.id === body.productId ? { ...p, status: nextStatus } : p));
      writeCatalogProducts(updated);
      return NextResponse.json({ ok: true, status: nextStatus });
    }
    if (body.action === 'save' && body.product) {
      const { getAllCatalogProducts, writeCatalogProducts } = await import('@/data/catalog');
      const all = getAllCatalogProducts();
      const exists = all.some((p) => p.id === body.product!.id);
      const updated = exists
        ? all.map((p) => (p.id === body.product!.id ? body.product! : p))
        : [body.product!, ...all];
      writeCatalogProducts(updated);
      return NextResponse.json({ ok: true, product: body.product });
    }
  }

  return NextResponse.json({ ok: false, error: 'database_unavailable' }, { status: 503 });
}
