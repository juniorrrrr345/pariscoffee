export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>☕ Paris Coffee</h1>
      <p>Bienvenue sur Paris Coffee Delivery!</p>
      <p>Site en construction...</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>✅ Configuration</h2>
        <p>MongoDB: {process.env.MONGODB_URI ? 'Configuré' : 'Non configuré'}</p>
        <p>Cloudinary: {process.env.CLOUDINARY_CLOUD_NAME ? 'Configuré' : 'Non configuré'}</p>
      </div>
    </main>
  )
}