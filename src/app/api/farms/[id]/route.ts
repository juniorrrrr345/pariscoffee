import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb-runtime';
import Farm from '@/models/Farm';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const data = await request.json();
    
    const farm = await Farm.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!farm) {
      return NextResponse.json({ error: 'Farm non trouvée' }, { status: 404 });
    }

    return NextResponse.json(farm);
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const farm = await Farm.findByIdAndDelete(params.id);

    if (!farm) {
      return NextResponse.json({ error: 'Farm non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Farm supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}