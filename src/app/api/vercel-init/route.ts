import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb-fixed';
import initializeDatabase from '@/scripts/initDB';

export async function GET() {
  try {
    console.log('🚀 Initialisation automatique Vercel...');
    
    // Test de connexion
    await connectDB();
    console.log('✅ MongoDB: Connexion établie');
    
    // Initialisation de la base de données
    await initializeDatabase();
    console.log('✅ Base de données initialisée');
    
    return NextResponse.json({ 
      success: true,
      message: 'Initialisation Vercel réussie ✅',
      timestamp: new Date().toISOString(),
      steps: [
        'Connexion MongoDB établie',
        'Base de données initialisée',
        'Produits, catégories et farms créés',
        'Paramètres configurés',
        'Pages initialisées'
      ]
    });
  } catch (error) {
    console.error('❌ Erreur initialisation Vercel:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Erreur initialisation ❌',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Permettre POST aussi
}