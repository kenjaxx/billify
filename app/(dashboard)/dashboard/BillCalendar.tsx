'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  category: { name: string; icon: string | null }
}

const statusColor = {
  PAID:    '#34d399',
  UNPAID:  '#fbbf24',
  OVERDUE: '#f87171',
}

export default function BillCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bills')
      .then(r => r.json())
      .then(data => { setBills(data); setLoading(false) })
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getBillsForDay = (day: Date) =>
    bills.filter(b => isSameDay(new Date(b.dueDate), day))

  const selectedBills = selectedDay ? getBillsForDay(selectedDay) : []

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
          Bill Calendar
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevMonth} style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: '0.5px solid var(--border-strong)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '110px', textAlign: 'center' }}>
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: '0.5px solid var(--border-strong)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '10px',
            color: 'var(--text-muted)', padding: '4px 0',
            fontWeight: '500',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{
            width: '20px', height: '20px',
            border: '2px solid rgba(59,130,246,0.3)',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map(day => {
            const dayBills = getBillsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <div
                key={day.toISOString()}
                onClick={() => dayBills.length > 0 && setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: '52px',
                  borderRadius: '8px',
                  padding: '4px',
                  background: isSelected
                    ? 'rgba(59,130,246,0.15)'
                    : isToday
                    ? 'rgba(59,130,246,0.08)'
                    : 'transparent',
                  border: isSelected
                    ? '0.5px solid rgba(59,130,246,0.4)'
                    : isToday
                    ? '0.5px solid rgba(59,130,246,0.2)'
                    : '0.5px solid transparent',
                  cursor: dayBills.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  opacity: isCurrentMonth ? 1 : 0.3,
                }}
              >
                <p style={{
                  fontSize: '11px',
                  fontWeight: isToday ? '600' : '400',
                  color: isToday ? '#3b82f6' : 'var(--text-secondary)',
                  textAlign: 'right',
                  marginBottom: '2px',
                }}>
                  {format(day, 'd')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {dayBills.slice(0, 2).map(bill => (
                    <div key={bill.id} style={{
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: `${statusColor[bill.status]}20`,
                      color: statusColor[bill.status],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                    }}>
                      {bill.category.icon} {bill.title}
                    </div>
                  ))}
                  {dayBills.length > 2 && (
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                      +{dayBills.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
        {[['PAID', '#34d399', 'Paid'], ['UNPAID', '#fbbf24', 'Unpaid'], ['OVERDUE', '#f87171', 'Overdue']].map(([, color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day bills */}
      {selectedDay && selectedBills.length > 0 && (
        <div style={{
          marginTop: '12px',
          background: 'var(--bg-tertiary)',
          border: '0.5px solid var(--border)',
          borderRadius: '10px',
          padding: '14px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '10px' }}>
            {format(selectedDay, 'MMMM d, yyyy')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedBills.map(bill => (
              <div key={bill.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{bill.category.icon ?? '📄'}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{bill.title}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{bill.category.name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    ₱{bill.amount.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '10px', color: statusColor[bill.status] }}>
                    {bill.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}