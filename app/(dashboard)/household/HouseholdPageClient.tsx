'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Users, UserPlus, Trash2, Check, X as XIcon, Home,
  Pencil, CheckCircle, Clock, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { fetcher } from '@/lib/swr-fetcher'
import EditBillModal from '@/app/(dashboard)/bills/EditBillModal'
import SplitDetailsModal from '@/components/bills/SplitDetailsModal'
import ReceiptViewButton from '@/components/bills/ReceiptViewButton'

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

type SplitInfo = {
  id: string
  amount: number
  isPaid: boolean
  householdMember: { id: string; userId: string | null; name: string | null; email: string }
}

type SharedBill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  isRecurring: boolean
  notes: string | null
  receiptUrl: string | null
  receiptName: string | null
  paymentMethod: string | null
  categoryId: string
  userId: string
  user: { name: string | null; email: string }
  category: { name: string; icon: string | null; color: string | null }
  splits: SplitInfo[]
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

// Derives a display status from the SPLITS rather than trusting the raw
// bill.status alone — a bill can be "fully paid" the moment every member's
// share is settled (handled by the split PATCH route), but while that's in
// progress we want to show "Pending" instead of a flat Unpaid/Overdue.
function getSplitDisplay(bill: SharedBill) {
  const total = bill.amount
  const paid = bill.splits.reduce((sum, s) => sum + (s.isPaid ? s.amount : 0), 0)
  const isFullyPaid = bill.splits.length > 0 && bill.splits.every(s => s.isPaid)

  if (isFullyPaid) {
    return { paid, total, label: 'Paid', color: '#34d399', bg: 'rgba(52,211,153,0.1)', Icon: CheckCircle }
  }
  if (paid > 0) {
    return { paid, total, label: 'Pending', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', Icon: Clock }
  }

  const isOverdue = new Date(bill.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  if (isOverdue) {
    return { paid, total, label: 'Overdue', color: '#f87171', bg: 'rgba(248,113,113,0.1)', Icon: AlertCircle }
  }
  return { paid, total, label: 'Unpaid', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', Icon: Clock }
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

  const { data: sharedBills = [], mutate: mutateSharedBills } = useSWR<SharedBill[]>(
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

  // Shared bill management
  const [editingBill, setEditingBill] = useState<SharedBill | null>(null)
  const [splitModalBill, setSplitModalBill] = useState<SharedBill | null>(null)
  const [pendingDeleteBill, setPendingDeleteBill] = useState<SharedBill | null>(null)
  const [billActionLoading, setBillActionLoading] = useState<string | null>(null)
  const [confirmBillLoading, setConfirmBillLoading] = useState(false)
  const [splitActionLoadingId, setSplitActionLoadingId] = useState<string | null>(null)

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

  // Toggles the CURRENT user's own share on a shared bill. Any household
  // member can do this for their own split; the bill's overall status is
  // auto-recalculated server-side once every member's share is paid.
  const toggleMySplit = async (bill: SharedBill, split: SplitInfo) => {
    setSplitActionLoadingId(split.id)
    try {
      const res = await fetch(`/api/bills/${bill.id}/splits/${split.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !split.isPaid }),
      })
      if (!res.ok) throw new Error()
      toast.success(split.isPaid ? 'Marked your share as unpaid.' : 'Marked your share as paid.')
      await mutateSharedBills()
    } catch {
      toast.error('Could not update your share.')
    } finally {
      setSplitActionLoadingId(null)
    }
  }

  const confirmDeleteBill = async () => {
    if (!pendingDeleteBill) return
    setConfirmBillLoading(true)
    setBillActionLoading(pendingDeleteBill.id)
    try {
      const res = await fetch(`/api/bills/${pendingDeleteBill.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`"${pendingDeleteBill.title}" deleted.`)
      await mutateSharedBills()
    } catch {
      toast.error('Could not delete bill.')
    } finally {
      setBillActionLoading(null)
      setConfirmBillLoading(false)
      setPendingDeleteBill(null)
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

      {/* Balances overview */}
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Balances
        </h2>
        {sharedBills.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No shared bills yet"
            description="Turn on 'Split with household' when adding or editing a bill on the Bills page — it'll show up here instead of your personal bill list."
          />
        ) : memberTotals.size === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No balances to show yet.</p>
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

      {/* Full shared bills list */}
      {sharedBills.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Shared bills</h2>
          </div>

          {sharedBills.map((bill, i) => {
            const display = getSplitDisplay(bill)
            const StatusIcon = display.Icon
            const isOwner = bill.userId === currentUserId
            const isLoading = billActionLoading === bill.id
            const creatorLabel = bill.user.name ?? bill.user.email.split('@')[0]
            const mySplit = bill.splits.find(s => s.householdMember.userId === currentUserId) ?? null
            const mySplitLoading = mySplit ? splitActionLoadingId === mySplit.id : false

            return (
              <div
                key={bill.id}
                className="bill-row"
                style={{ borderBottom: i < sharedBills.length - 1 ? '0.5px solid var(--border)' : 'none' }}
              >
                <div className="bill-row-left">
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--icon-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {bill.category.icon ?? '📄'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {bill.title}
                      {bill.isRecurring && (
                        <span style={{
                          marginLeft: '6px', fontSize: '9px', fontWeight: '600',
                          color: '#60a5fa', background: 'rgba(59,130,246,0.12)',
                          padding: '1px 6px', borderRadius: '99px',
                        }}>
                          RECURRING
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Due {format(new Date(bill.dueDate), 'MMM d, yyyy')} · {bill.category.name} · Added by {isOwner ? 'you' : creatorLabel}
                    </p>
                  </div>
                </div>

                <div className="bill-row-right">
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: '500',
                    padding: '4px 10px', borderRadius: '99px',
                    background: display.bg, color: display.color,
                  }}>
                    <StatusIcon size={11} />
                    {display.label}
                  </span>

                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right' }}>
                    ₱{display.paid.toLocaleString()}
                    <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
                      /₱{display.total.toLocaleString()}
                    </span>
                  </span>

                  {mySplit && (
                    mySplit.isPaid ? (
                      <button
                        type="button"
                        onClick={() => toggleMySplit(bill, mySplit)}
                        disabled={mySplitLoading}
                        title="Click to undo — mark your share unpaid"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '11px', fontWeight: '500',
                          padding: '5px 10px', borderRadius: '99px', border: 'none',
                          background: 'rgba(52,211,153,0.12)', color: '#34d399',
                          cursor: mySplitLoading ? 'not-allowed' : 'pointer',
                          opacity: mySplitLoading ? 0.6 : 1,
                        }}
                      >
                        <Check size={11} /> You paid ₱{mySplit.amount.toLocaleString()}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => toggleMySplit(bill, mySplit)}
                        disabled={mySplitLoading}
                        style={{ background: '#34d399', color: '#0a0c10' }}
                      >
                        {mySplitLoading ? 'Saving...' : `Mark my ₱${mySplit.amount.toLocaleString()} paid`}
                      </Button>
                    )
                  )}

                  <div style={{ display: 'flex', gap: '2px' }}>
                    <IconActionButton
                      icon={Users}
                      tone="info"
                      label="View split"
                      onClick={() => setSplitModalBill(bill)}
                      disabled={isLoading}
                    />
                    {bill.receiptUrl && <ReceiptViewButton billId={bill.id} />}
                    {isOwner && (
                      <>
                        <IconActionButton
                          icon={Pencil}
                          tone="default"
                          label="Edit"
                          onClick={() => setEditingBill(bill)}
                          disabled={isLoading}
                        />
                        <IconActionButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          onClick={() => setPendingDeleteBill(bill)}
                          disabled={isLoading}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSuccess={() => {
            setEditingBill(null)
            toast.success('Bill updated.')
            mutateSharedBills()
          }}
        />
      )}

      {splitModalBill && (
        <SplitDetailsModal
          billId={splitModalBill.id}
          billTitle={splitModalBill.title}
          splits={splitModalBill.splits}
          currentUserId={currentUserId}
          canManage={splitModalBill.userId === currentUserId}
          onClose={() => setSplitModalBill(null)}
          onUpdated={() => mutateSharedBills()}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteBill !== null}
        title="Delete this shared bill?"
        description={`"${pendingDeleteBill?.title ?? ''}" will be permanently deleted for everyone in the household. This cannot be undone.`}
        confirmLabel="Delete"
        loading={confirmBillLoading}
        onConfirm={confirmDeleteBill}
        onCancel={() => setPendingDeleteBill(null)}
      />
    </div>
  )
}