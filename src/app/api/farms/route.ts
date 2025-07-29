import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb-fixed';
import Farm from '@/models/Farm';

export async function GET() {
  try {
    await connectDB();
    const farms = await Farm.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(farms);
  } catch (error) {
    console.error('Error fetching farms:', error);
    return NextResponse.json({ error: 'Failed to fetch farms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const farm = new Farm(data);
    await farm.save();
    return NextResponse.json(farm, { status: 201 });
  } catch (error) {
    console.error('Error creating farm:', error);
    return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 });
  }
}