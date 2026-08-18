'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function MobileFAB() {
  const router = useRouter()
  const pathname = usePathname()

  // Bills already has its own "Add Bill" button in the header there,
  // so hide the FAB on that page to avoid two ways to do the same thing.
  if (pathname === '/bills') return null

  return (
    <button
      onClick={() => router.push('/bills?add=1')}
      aria-label="Add bill"
      title="Add bill"
      className="md:hidden"
      style={{
        position: 'fixed', right: '18px', bottom: '80px', zIndex: 60,
        width: '52px', height: '52px', borderRadius: '50%',
        background: '#3b82f6', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(59,130,246,0.45)',
        cursor: 'pointer',
      }}
    >
      <Plus size={24} color="#fff" />
    </button>
  )
}