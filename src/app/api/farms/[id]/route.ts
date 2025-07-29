import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb-fixed';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const farmsCollection = db.collection('farms');
    
    const data = await request.json();
    const { ObjectId } = require('mongodb');
    
    const result = await farmsCollection.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Farm non trouvée' }, { status: 404 });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const farmsCollection = db.collection('farms');
    
    const { ObjectId } = require('mongodb');
    const result = await farmsCollection.findOneAndDelete({ _id: new ObjectId(params.id) });

    if (!result.value) {
      return NextResponse.json({ error: 'Farm non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Farm supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}