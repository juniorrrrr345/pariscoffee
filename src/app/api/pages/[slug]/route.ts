import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb-runtime';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const page = await db.collection('pages').findOne({ slug: params.slug });
    
    return NextResponse.json({
      content: page?.content || '',
      title: page?.title || params.slug
    });
  } catch (error) {
    return NextResponse.json({ content: '', title: params.slug });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { content, title } = await request.json();
    const { db } = await connectToDatabase();
    
    await db.collection('pages').replaceOne(
      { slug: params.slug },
      { slug: params.slug, title, content, updatedAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  return POST(req, context);
}