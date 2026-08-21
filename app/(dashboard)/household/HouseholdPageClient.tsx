'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Trash2, Check, X as XIcon, Home } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { fetcher } from '@/lib/swr-fetcher'

type Member = {
  id: string
  email: string
  name: string | null
  status: 'PENDING' | 'ACCEPTED'
  userId: string | null
}

type Household = {
  id: string
  name: string
  ownerId: string
  isOwner: boolean
  members: Member[]
}

type Invite = {
  id: string
  householdName: string
  ownerName: string
  invitedAt: string
}

type SharedBill = {
  id: string
  title: string
  amount: number
  userId: string
  user: { name: string | null; email: string }
  splits: {
    id: string
    amount: number
    isPaid: boolean
    householdMember: { id: string; userId: string | null; name: string | null; email: string }
  }[]
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
}

export default function HouseholdPageClient({
  currentUserId,
  initialHousehold,
  initialInvites,
}: {
  currentUserId: string
  initialHousehold: Household | null
  initialInvites: Invite[]
}) {
  const router = useRouter()

  const { data: household, mutate: mutateHousehold } = useSWR<Household | null>(
    '/api/household',
    async (url: string) => {
      const res = await fetcher<{ household: Household | null }>(url)
      return res.household
    },
    { fallbackData: initialHousehold }
  )

  const { data: invites = [], mutate: mutateInvites } = useSWR<Invite[]>(
    '/api/household/invites',
    async (url: string) => {
      const res = await fetcher<{ invites: Invite[] }>(url)
      return res.invites
    },
    { fallbackData: initialInvites }
  )

  const { data: sharedBills = [] } = useSWR<SharedBill[]>(
    household ? '/api/household/bills' : null,
    async (url: string) => {
      const res = await fetcher<{ bills: SharedBill[] }>(url)
      return res.bills
    }
  )

  const [creating, setCreating] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invitesActionId, setInvitesActionId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create household')
      toast.success('Household created.')
      setHouseholdName('')
      await mutateHousehold()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create household.')
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite')
      toast.success(`Invite sent to ${inviteEmail.trim()}.`)
      setInviteEmail('')
      await mutateHousehold()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite.')
    } finally {
      setInviting(false)
    }
  }

  const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
    setInvitesActionId(inviteId)
    try {
      const res = await fetch(`/api/household/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update invite')
      toast.success(action === 'accept' ? "You've joined the household." : 'Invite declined.')
      await Promise.all([mutateInvites(), mutateHousehold()])
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update invite.')
    } finally {
      setInvitesActionId(null)
    }
  }

  const confirmRemove = async () => {
    if (!pendingRemove) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/household/members/${pendingRemove.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Member removed.')
      await mutateHousehold()
    } catch {
      toast.error('Could not remove member.')
    } finally {
      setRemoving(false)
      setPendingRemove(null)
    }
  }

  // Household-wide ledger — each member's total owed vs. total paid
  // across every bill shared with this household.
  const memberTotals = new Map<string, { name: string; owed: number; paid: number }>()
  sharedBills.forEach(bill => {
    bill.splits.forEach(split => {
      const key = split.householdMember.id
      const label = split.householdMember.name ?? split.householdMember.email.split('@')[0]
      const entry = memberTotals.get(key) ?? { name: label, owed: 0, paid: 0 }
      entry.owed += split.amount
      if (split.isPaid) entry.paid += split.amount
      memberTotals.set(key, entry)
    })
  })

  if (!household) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Household</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Share bills with a partner or roommate
          </p>
        </div>

        {invites.length > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '20px', marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '14px' }}>
              Pending invites
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {invites.map(invite => (
                <div key={invite.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', gap: '10px', flexWrap: 'wrap',
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                    <strong>{invite.ownerName}</strong> invited you to join &quot;{invite.householdName}&quot;
                  </p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button size="sm" disabled={invitesActionId === invite.id} onClick={() => handleInviteAction(invite.id, 'accept')}>
                      <Check size={13} /> Accept
                    </Button>
                    <Button size="sm" variant="outline" disabled={invitesActionId === invite.id} onClick={() => handleInviteAction(invite.id, 'decline')}>
                      <XIcon size={13} /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px',
        }}>
          <EmptyState
            icon={Home}
            title="No household yet"
            description="Create a household to start inviting a partner or roommate and splitting bills together."
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <input
              type="text"
              placeholder="e.g. Our Apartment"
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateHousehold()}
              style={inputStyle}
            />
            <Button onClick={handleCreateHousehold} disabled={creating || !householdName.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>{household.name}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {household.members.filter(m => m.status === 'ACCEPTED').length} member(s) sharing bills
        </p>
      </div>

      {household.isOwner && (
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px', marginBottom: '16px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Invite someone
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="partner@email.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              style={inputStyle}
            />
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              <UserPlus size={14} />
              {inviting ? 'Sending...' : 'Send invite'}
            </Button>
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
      }}>
        {household.members.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', flexWrap: 'wrap', gap: '10px',
            borderBottom: i < household.members.length - 1 ? '0.5px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'var(--icon-bg)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={16} color="var(--text-secondary)" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {m.name ?? m.email.split('@')[0]}
                  {m.userId === household.ownerId && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: '600', color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '1px 6px', borderRadius: '99px' }}>
                      OWNER
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {m.email} · {m.status === 'PENDING' ? 'Invite pending' : 'Joined'}
                </p>
              </div>
            </div>
            {(household.isOwner || m.userId === currentUserId) && m.userId !== household.ownerId && (
              <button
                onClick={() => setPendingRemove(m)}
                aria-label={`Remove ${m.email}`}
                title={m.userId === currentUserId ? 'Leave household' : 'Remove member'}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  border: '0.5px solid rgba(248,113,113,0.35)', background: 'transparent',
                  color: '#f87171', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Shared bill balances
        </h2>
        {sharedBills.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No shared bills yet"
            description="Turn on 'Split with household' when adding or editing a bill to see balances here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from(memberTotals.entries()).map(([id, entry]) => (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{entry.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ₱{entry.paid.toLocaleString()} paid of ₱{entry.owed.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={pendingRemove?.userId === currentUserId ? 'Leave this household?' : 'Remove this member?'}
        description={
          pendingRemove?.userId === currentUserId
            ? 'You will lose access to shared bills and balances. This cannot be undone.'
            : `"${pendingRemove?.email}" will lose access to shared bills. Their split history will be removed. This cannot be undone.`
        }
        confirmLabel={pendingRemove?.userId === currentUserId ? 'Leave' : 'Remove'}
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}