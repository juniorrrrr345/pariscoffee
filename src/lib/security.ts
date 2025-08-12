import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ===================================
// 🔐 CONFIGURATION
// ===================================

const JWT_SECRET = process.env.JWT_SECRET || 'changez-moi-en-production';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'changez-moi-32-caracteres-minimum';
const SALT_ROUNDS = 12;

// ===================================
// 🔒 HACHAGE DE MOT DE PASSE
// ===================================

/**
 * Hacher un mot de passe de manière sécurisée
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifier un mot de passe contre son hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===================================
// 🎫 GESTION DES TOKENS JWT
// ===================================

interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Créer un token JWT
 */
export function createToken(payload: TokenPayload, expiresIn: string = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Vérifier et décoder un token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Créer un token de réinitialisation de mot de passe
 */
export function createResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

// ===================================
// 🔐 CHIFFREMENT DES DONNÉES
// ===================================

const algorithm = 'aes-256-gcm';

/**
 * Chiffrer des données sensibles
 */
export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Déchiffrer des données
 */
export function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ===================================
// 🛡️ PROTECTION CSRF
// ===================================

/**
 * Générer un token CSRF
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valider un token CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// ===================================
// 🔍 ANONYMISATION DES DONNÉES
// ===================================

/**
 * Anonymiser une adresse email
 */
export function anonymizeEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const anonymized = localPart.slice(0, 2) + '***';
  return `${anonymized}@${domain}`;
}

/**
 * Anonymiser une adresse IP
 */
export function anonymizeIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    // IPv4
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // IPv6 ou autre
  return ip.substring(0, ip.length / 2) + '...';
}

/**
 * Hacher des données pour les logs (ne pas pouvoir les récupérer)
 */
export function hashForLogging(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// ===================================
// 🚦 VÉRIFICATIONS DE SÉCURITÉ
// ===================================

/**
 * Vérifier si une URL est sûre (prévention des redirections malveillantes)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'localhost',
      '127.0.0.1'
    ].filter(Boolean);
    
    return allowedHosts.some(host => 
      parsed.hostname === host || 
      parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Nettoyer les entrées utilisateur (prévention XSS basique)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Générer un identifiant unique sécurisé
 */
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ===================================
// 🔑 GESTION DES SESSIONS
// ===================================

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Créer une nouvelle session
 */
export function createSession(userId: string, duration: number = 24 * 60 * 60 * 1000): Session {
  const now = new Date();
  return {
    id: generateSecureId(),
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + duration)
  };
}

/**
 * Vérifier si une session est valide
 */
export function isSessionValid(session: Session): boolean {
  return new Date() < session.expiresAt;
}

// ===================================
// 🔐 PROTECTION DES ROUTES API
// ===================================

/**
 * Vérifier une clé API
 */
export function validateApiKey(apiKey: string): boolean {
  const validApiKey = process.env.INTERNAL_API_KEY;
  return apiKey === validApiKey && apiKey.length >= 32;
}

/**
 * Générer une signature pour les requêtes
 */
export function generateRequestSignature(data: any, secret: string): string {
  const payload = JSON.stringify(data);
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Vérifier une signature de requête
 */
export function verifyRequestSignature(
  data: any,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateRequestSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ===================================
// 📊 MONITORING DE SÉCURITÉ
// ===================================

interface SecurityEvent {
  type: 'login_attempt' | 'failed_auth' | 'suspicious_activity' | 'rate_limit';
  ip: string;
  userId?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Logger un événement de sécurité
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // En production, envoyez ceci à un service de monitoring
  console.log('🔒 Security Event:', {
    ...event,
    ip: anonymizeIP(event.ip),
    userId: event.userId ? hashForLogging(event.userId) : undefined
  });
}

// Export des types
export type { TokenPayload, Session, SecurityEvent };