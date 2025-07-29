import { NextResponse } from 'next/server';
import initializeDatabase from '@/scripts/initDB';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Base de données initialisée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation :', error);
    return NextResponse.json({ error: 'Erreur lors de l\'initialisation' }, { status: 500 });
  }
}