'use client'

import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react'
import Link from 'next/link'

type Bill = {
  id: string
  userId: string
  splits: {
    amount: number
    isPaid: boolean
    householdMember: { userId: string | null }
  }[]
}

export default function HouseholdBalanceWidget({ currentUserId }: { currentUserId: string }) {
  const [bills, setBills] = useState<Bill[] | null>(null)

  useEffect(() => {
    fetch('/api/household/bills')
      .then(r => r.json())
      .then(data => setBills(data.bills ?? []))
      .catch(() => setBills([]))
  }, [])

  if (!bills || bills.length === 0) return null

  let youOwe = 0
  let owedToYou = 0

  bills.forEach(bill => {
    bill.splits.forEach(split => {
      if (split.isPaid) return
      const isYourShare = split.householdMember.userId === currentUserId
      if (isYourShare && bill.userId !== currentUserId) youOwe += split.amount
      if (!isYourShare && bill.userId === currentUserId) owedToYou += split.amount
    })
  })

  if (youOwe === 0 && owedToYou === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '20px',
      display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: 'rgba(167,139,250,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={16} color="#a78bfa" />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Household balance</p>
          <Link href="/household" style={{ fontSize: '11px', color: '#60a5fa' }}>View household</Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpRight size={14} color="#f87171" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>You owe</p>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#f87171' }}>₱{youOwe.toLocaleString()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowDownLeft size={14} color="#34d399" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Owed to you</p>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#34d399' }}>₱{owedToYou.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}