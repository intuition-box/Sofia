export const metadata = {
  title: 'Sofia Profile',
  description: 'Share your Sofia profile on X',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
