import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/theme-context'
import { SWRProvider } from '@/lib/swr-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Billify',
  description: 'Track and manage your bills',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Runs before React hydrates, synchronously setting data-theme
// so there's no dark->light (or light->dark) flash on load.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('billify-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SWRProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SWRProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}