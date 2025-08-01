// Exemple d'upload côté client (React/Next.js)
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'coffee_uploads'); // Votre preset
  formData.append('cloud_name', 'dvglphdty');        // Votre cloud name

  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dvglphdty/image/upload',
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    console.log('Image uploadée:', data.secure_url);
    
    // URLs générées automatiquement :
    console.log('Miniature:', data.eager[0].secure_url);  // 200x200
    console.log('Moyenne:', data.eager[1].secure_url);    // 500x500
    
    return data;
  } catch (error) {
    console.error('Erreur upload:', error);
  }
};

// Exemple avec le widget Cloudinary
const openCloudinaryWidget = () => {
  cloudinary.createUploadWidget(
    {
      cloudName: 'dvglphdty',
      uploadPreset: 'coffee_uploads',
      sources: ['local', 'url', 'camera'],
      multiple: true,
      maxFiles: 5,
      folder: 'coffee/products',
      clientAllowedFormats: ['jpg', 'png', 'webp'],
      maxFileSize: 10485760,
      language: 'fr',
      text: {
        fr: {
          or: 'Ou',
          menu: {
            files: 'Mes fichiers',
            camera: 'Caméra'
          }
        }
      }
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        console.log('Image uploadée:', result.info);
      }
    }
  ).open();
};