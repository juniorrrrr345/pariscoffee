export const metadata = {
  title: 'Paris Coffee - Livraison de Café',
  description: 'Service de livraison de café à Paris',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}