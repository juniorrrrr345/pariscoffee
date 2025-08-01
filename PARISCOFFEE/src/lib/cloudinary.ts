import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvglphdty',
  api_key: process.env.CLOUDINARY_API_KEY || 'VOTRE_API_KEY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'VOTRE_API_SECRET',
  secure: true,
};

console.log('🔧 Configuration Cloudinary chargée:', {
  cloud_name: config.cloud_name,
  api_key: config.api_key ? `${config.api_key.substring(0, 6)}...` : 'MANQUANT',
  api_secret: config.api_secret ? 'OK' : 'MANQUANT'
});

cloudinary.config(config);

export default cloudinary;