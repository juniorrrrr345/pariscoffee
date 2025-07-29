import { NextResponse } from 'next/server';
import contentCache from '@/lib/contentCache';

export async function POST() {
  try {
    // Forcer le rechargement du cache
    await contentCache.refresh();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur invalidation cache:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}