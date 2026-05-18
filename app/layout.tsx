import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Billify',
  description: 'Track your home expenses and utilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={geist.className} style={{ background: '#0f1117', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}