import { z } from 'zod';

// ===================================
// 🔒 SCHÉMAS DE VALIDATION UTILISATEUR
// ===================================

// Validation pour la connexion
export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long')
});

// Validation pour l'inscription
export const signupSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// ===================================
// 🛍️ SCHÉMAS POUR E-COMMERCE
// ===================================

// Validation pour un produit
export const productSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom est trop long')
    .trim(),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description est trop longue')
    .trim(),
  price: z.number()
    .positive('Le prix doit être positif')
    .max(1000000, 'Prix trop élevé')
    .multipleOf(0.01, 'Le prix doit avoir maximum 2 décimales'),
  stock: z.number()
    .int('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif'),
  category: z.string()
    .min(2, 'La catégorie est requise')
    .max(50, 'Nom de catégorie trop long'),
  images: z.array(z.string().url('URL d\'image invalide'))
    .max(10, 'Maximum 10 images par produit')
    .optional(),
  isActive: z.boolean().default(true)
});

// Validation pour une commande
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'ID produit requis'),
    quantity: z.number()
      .int('Quantité doit être un nombre entier')
      .positive('Quantité doit être positive')
      .max(100, 'Quantité trop élevée')
  })).min(1, 'La commande doit contenir au moins un article'),
  
  shippingAddress: z.object({
    firstName: z.string().min(2, 'Prénom requis').max(50),
    lastName: z.string().min(2, 'Nom requis').max(50),
    address: z.string().min(5, 'Adresse requise').max(200),
    city: z.string().min(2, 'Ville requise').max(100),
    postalCode: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
    country: z.string().min(2, 'Pays requis').max(50),
    phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Numéro de téléphone invalide').optional()
  }),
  
  paymentMethod: z.enum(['card', 'paypal', 'crypto']),
  
  email: z.string().email('Email invalide pour la confirmation')
});

// ===================================
// 🔐 SCHÉMAS DE SÉCURITÉ
// ===================================

// Validation pour les requêtes API
export const apiRequestSchema = z.object({
  apiKey: z.string().min(32, 'Clé API invalide'),
  timestamp: z.number().refine(
    (val) => {
      const now = Date.now();
      const diff = Math.abs(now - val);
      return diff < 300000; // 5 minutes de tolérance
    },
    { message: 'Requête expirée' }
  ),
  signature: z.string().optional()
});

// Validation pour le contact
export const contactSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  subject: z.string()
    .min(5, 'Le sujet doit contenir au moins 5 caractères')
    .max(200, 'Le sujet est trop long')
    .trim(),
  message: z.string()
    .min(20, 'Le message doit contenir au moins 20 caractères')
    .max(5000, 'Le message est trop long')
    .trim(),
  // Protection anti-spam
  honeypot: z.string().max(0, 'Spam détecté').optional()
});

// ===================================
// 🛡️ FONCTIONS UTILITAIRES
// ===================================

// Fonction pour valider et nettoyer les données
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Fonction pour nettoyer les entrées HTML (anti-XSS)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Fonction pour valider les IDs MongoDB
export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalide');

// Fonction pour valider les URLs
export const urlSchema = z.string().url('URL invalide').max(2048, 'URL trop longue');

// Validation pour les uploads de fichiers
export const fileUploadSchema = z.object({
  filename: z.string()
    .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Nom de fichier invalide')
    .max(255, 'Nom de fichier trop long'),
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ], {
    errorMap: () => ({ message: 'Type de fichier non autorisé' })
  }),
  size: z.number()
    .max(5 * 1024 * 1024, 'Fichier trop volumineux (max 5MB)')
});

// ===================================
// 🔍 VALIDATION DES PARAMÈTRES DE RECHERCHE
// ===================================

export const searchParamsSchema = z.object({
  q: z.string()
    .min(2, 'Recherche trop courte')
    .max(100, 'Recherche trop longue')
    .transform(val => sanitizeHtml(val))
    .optional(),
  page: z.coerce.number()
    .int()
    .positive()
    .default(1),
  limit: z.coerce.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  sort: z.enum(['asc', 'desc', 'newest', 'oldest', 'price_asc', 'price_desc'])
    .optional(),
  category: z.string()
    .max(50)
    .optional()
});

// Export des types TypeScript depuis les schémas
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;