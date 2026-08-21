import Papa from 'papaparse'
import { format } from 'date-fns'
import { getPaymentMethodMeta } from './payment-methods'

type BillStatus = 'PAID' | 'UNPAID' | 'OVERDUE'

type Bill = {
  title: string
  amount: number
  dueDate: string
  status: BillStatus
  isRecurring?: boolean
  notes?: string | null
  categoryId?: string
  paymentMethod?: string | null
  category: { name: string; icon: string | null; color?: string | null }
}

export function exportToCSV(bills: Bill[], filename = 'bills') {
  const data = bills.map(b => ({
    Title: b.title,
    Category: b.category.name,
    Amount: b.amount,
    'Due Date': format(new Date(b.dueDate), 'MMM d, yyyy'),
    Status: b.status,
    'Payment Method': getPaymentMethodMeta(b.paymentMethod)?.label ?? '',
    Recurring: b.isRecurring ? 'Yes' : 'No',
    Notes: b.notes ?? '',
  }))

  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const FONT_NAME = 'NotoSans'
const FONT_FILES: Record<'normal' | 'bold', string> = {
  normal: '/fonts/NotoSans-Regular.ttf',
  bold: '/fonts/NotoSans-Bold.ttf',
}

async function loadFontBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load font asset: ${url}`)
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function embedUnicodeFont(doc: any) {
  const [regular, bold] = await Promise.all([
    loadFontBase64(FONT_FILES.normal),
    loadFontBase64(FONT_FILES.bold),
  ])
  doc.addFileToVFS('NotoSans-Regular.ttf', regular)
  doc.addFont('NotoSans-Regular.ttf', FONT_NAME, 'normal')
  doc.addFileToVFS('NotoSans-Bold.ttf', bold)
  doc.addFont('NotoSans-Bold.ttf', FONT_NAME, 'bold')
  doc.setFont(FONT_NAME, 'normal')
}

function hexToRgb(hex: string | null | undefined): [number, number, number] {
  const fallback: [number, number, number] = [148, 163, 184]
  if (!hex) return fallback
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return fallback
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return fallback
  return [r, g, b]
}

const STATUS_STYLES: Record<BillStatus, { bg: [number, number, number]; text: [number, number, number] }> = {
  PAID: { bg: [209, 250, 229], text: [4, 120, 87] },
  UNPAID: { bg: [254, 243, 199], text: [180, 83, 9] },
  OVERDUE: { bg: [254, 226, 226], text: [185, 28, 28] },
}

type Group = { id: string; name: string; color: string | null; bills: Bill[]; total: number }

function groupByCategory(bills: Bill[]): Group[] {
  const map = new Map<string, Group>()
  bills.forEach(bill => {
    const key = bill.categoryId ?? bill.category.name
    if (!map.has(key)) {
      map.set(key, { id: key, name: bill.category.name, color: bill.category.color ?? null, bills: [], total: 0 })
    }
    const group = map.get(key)!
    group.bills.push(bill)
    group.total += bill.amount
  })
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export async function exportToPDF(
  bills: Bill[],
  filename = 'bills',
  options: { filterSummary?: string } = {}
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const marginX = 14
  const now = new Date()

  await embedUnicodeFont(doc)

  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Bill', marginX, 18)
  const billWidth = doc.getTextWidth('Bill')
  doc.setTextColor(59, 130, 246)
  doc.text('ify', marginX + billWidth, 18)

  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(180, 180, 180)
  doc.text('Bill Report', marginX, 26)
  doc.text(`Generated: ${format(now, 'MMMM d, yyyy')}`, marginX, 33)

  if (options.filterSummary) {
    doc.setFontSize(9)
    doc.setTextColor(96, 165, 250)
    doc.text(`Filtered: ${options.filterSummary}`, pageWidth - marginX, 33, { align: 'right' })
  }

  const total = bills.reduce((sum, b) => sum + b.amount, 0)
  const paid = bills.filter(b => b.status === 'PAID').length
  const unpaid = bills.filter(b => b.status === 'UNPAID').length
  const overdue = bills.filter(b => b.status === 'OVERDUE').length

  doc.setFillColor(22, 27, 39)
  doc.rect(0, 40, pageWidth, 24, 'F')

  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('TOTAL AMOUNT', marginX, 48)
  doc.text('PAID', 82, 48)
  doc.text('UNPAID', 116, 48)
  doc.text('OVERDUE', 155, 48)

  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(`₱${total.toLocaleString()}`, marginX, 58)
  doc.text(String(paid), 82, 58)
  doc.text(String(unpaid), 116, 58)
  doc.text(String(overdue), 155, 58)

  const groups = groupByCategory(bills)
  let cursorY = 76

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > pageHeight - 20) {
      doc.addPage()
      cursorY = 20
    }
  }

  if (groups.length === 0) {
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(11)
    doc.setTextColor(120, 120, 120)
    doc.text('No bills match the current view.', marginX, cursorY + 10)
    cursorY += 20
  }

  groups.forEach(group => {
    ensureSpace(24)

    const [cr, cg, cb] = hexToRgb(group.color)
    doc.setFillColor(245, 247, 255)
    doc.rect(marginX, cursorY, pageWidth - marginX * 2, 10, 'F')
    doc.setFillColor(cr, cg, cb)
    doc.circle(marginX + 5, cursorY + 5, 2.2, 'F')

    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(group.name, marginX + 11, cursorY + 6.5)
    const nameWidth = doc.getTextWidth(group.name)

    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `${group.bills.length} bill${group.bills.length !== 1 ? 's' : ''}`,
      marginX + 11 + nameWidth + 4,
      cursorY + 6.5
    )

    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(`₱${group.total.toLocaleString()}`, pageWidth - marginX - 2, cursorY + 6.5, { align: 'right' })

    cursorY += 13

    const hasNotes = group.bills.some(b => b.notes && b.notes.trim())
    const hasPayment = group.bills.some(b => b.paymentMethod)

    const head = ['Title', 'Due Date', 'Status', 'Amount']
    if (hasPayment) head.push('Payment')
    if (hasNotes) head.push('Notes')

    const paymentColIndex = hasPayment ? 4 : -1
    const notesColIndex = hasNotes ? (hasPayment ? 5 : 4) : -1

    const body = group.bills.map(b => {
      const row = [
        b.title,
        format(new Date(b.dueDate), 'MMM d, yyyy'),
        b.status,
        `₱${b.amount.toLocaleString()}`,
      ]
      if (hasPayment) row.push(getPaymentMethodMeta(b.paymentMethod)?.label ?? '—')
      if (hasNotes) row.push(b.notes && b.notes.trim() ? b.notes : '—')
      return row
    })

    const columnStyles: Record<number, any> = {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 28 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
    }
    if (hasPayment) columnStyles[paymentColIndex] = { cellWidth: 30, halign: 'center' }
    if (hasNotes) columnStyles[notesColIndex] = { cellWidth: 42 }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [head],
      body,
      styles: {
        font: FONT_NAME,
        fontSize: 9,
        textColor: [30, 30, 30],
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: { fillColor: [250, 251, 253] },
      columnStyles,
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.text = []
        }
        if (data.section === 'body' && hasPayment && data.column.index === paymentColIndex) {
          data.cell.text = []
        }
      },
      didDrawCell: data => {
        if (data.section !== 'body') return
        const bill = group.bills[data.row.index]
        if (!bill) return

        if (data.column.index === 2) {
          const style = STATUS_STYLES[bill.status]
          doc.setFont(FONT_NAME, 'bold')
          doc.setFontSize(7.5)
          const textW = doc.getTextWidth(bill.status)
          const pillW = textW + 6
          const pillH = 5.5
          const px = data.cell.x + (data.cell.width - pillW) / 2
          const py = data.cell.y + (data.cell.height - pillH) / 2
          doc.setFillColor(...style.bg)
          doc.roundedRect(px, py, pillW, pillH, 1.5, 1.5, 'F')
          doc.setTextColor(...style.text)
          doc.text(bill.status, px + pillW / 2, py + pillH / 2 + 2.6, { align: 'center' })
        }

        if (hasPayment && data.column.index === paymentColIndex) {
          const meta = getPaymentMethodMeta(bill.paymentMethod)
          doc.setFont(FONT_NAME, 'normal')
          doc.setFontSize(8)
          if (meta) {
            const [pr, pg, pb] = hexToRgb(meta.color)
            const dotX = data.cell.x + data.cell.width / 2 - (doc.getTextWidth(meta.label) / 2) - 4
            const dotY = data.cell.y + data.cell.height / 2
            doc.setFillColor(pr, pg, pb)
            doc.circle(dotX, dotY, 1.3, 'F')
            doc.setTextColor(70, 70, 70)
            doc.text(meta.label, data.cell.x + data.cell.width / 2 + 2, dotY + 1.2, { align: 'center' })
          } else {
            doc.setTextColor(170, 170, 170)
            doc.text('—', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1.2, { align: 'center' })
          }
        }

        if (data.column.index === 0 && bill.isRecurring) {
          doc.setFont(FONT_NAME, 'normal')
          doc.setFontSize(9)
          const titleW = doc.getTextWidth(bill.title)
          const label = 'RECURRING'
          doc.setFont(FONT_NAME, 'bold')
          doc.setFontSize(5.8)
          const textW = doc.getTextWidth(label)
          const pillW = textW + 4
          const pillH = 4
          const badgeX = data.cell.x + 4 + titleW + 3
          const py = data.cell.y + (data.cell.height - pillH) / 2
          if (badgeX + pillW < data.cell.x + data.cell.width - 2) {
            doc.setFillColor(219, 234, 254)
            doc.roundedRect(badgeX, py, pillW, pillH, 1, 1, 'F')
            doc.setTextColor(37, 99, 235)
            doc.text(label, badgeX + pillW / 2, py + pillH / 2 + 1.8, { align: 'center' })
          }
        }
      },
    })

    cursorY = (doc as any).lastAutoTable.finalY + 8
  })

  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} — Billify`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  doc.save(`${filename}-${format(now, 'yyyy-MM-dd')}.pdf`)
}

// ────────────────────────────────────────────────────────────────
// Shared bills export — each bill's total is broken down by exactly
// how much every household member owes/paid, mirroring what's shown
// in the Shared Bills section of the app.
// ────────────────────────────────────────────────────────────────

export type SharedBillSplitExport = {
  memberName: string
  amount: number
  isPaid: boolean
  paidAt?: string | Date | null
}

export type SharedBillExport = {
  title: string
  categoryName: string
  categoryColor?: string | null
  dueDate: string | Date
  amount: number
  addedBy: string
  splits: SharedBillSplitExport[]
}

type SharedDisplayLabel = 'PAID' | 'PENDING' | 'UNPAID' | 'OVERDUE'

function getSharedBillDisplay(bill: SharedBillExport): { label: SharedDisplayLabel; paid: number } {
  const paid = bill.splits.reduce((sum, s) => sum + (s.isPaid ? s.amount : 0), 0)
  const isFullyPaid = bill.splits.length > 0 && bill.splits.every(s => s.isPaid)
  if (isFullyPaid) return { label: 'PAID', paid }
  if (paid > 0) return { label: 'PENDING', paid }
  const isOverdue = new Date(bill.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  return { label: isOverdue ? 'OVERDUE' : 'UNPAID', paid }
}

const SHARED_STATUS_STYLES: Record<SharedDisplayLabel, { bg: [number, number, number]; text: [number, number, number] }> = {
  PAID: { bg: [209, 250, 229], text: [4, 120, 87] },
  PENDING: { bg: [219, 234, 254], text: [29, 78, 216] },
  UNPAID: { bg: [254, 243, 199], text: [180, 83, 9] },
  OVERDUE: { bg: [254, 226, 226], text: [185, 28, 28] },
}

export async function exportSharedBillsToPDF(
  bills: SharedBillExport[],
  householdName: string,
  filename = 'shared-bills'
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const marginX = 14
  const now = new Date()

  await embedUnicodeFont(doc)

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Bill', marginX, 18)
  const billWidth = doc.getTextWidth('Bill')
  doc.setTextColor(59, 130, 246)
  doc.text('ify', marginX + billWidth, 18)

  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(180, 180, 180)
  doc.text(`Shared Bills — ${householdName}`, marginX, 26)
  doc.text(`Generated: ${format(now, 'MMMM d, yyyy')}`, marginX, 33)

  // Summary bar
  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
  const totalPaid = bills.reduce((sum, b) => sum + getSharedBillDisplay(b).paid, 0)
  const totalPending = Math.max(totalAmount - totalPaid, 0)
  const fullySettled = bills.filter(b => getSharedBillDisplay(b).label === 'PAID').length

  doc.setFillColor(22, 27, 39)
  doc.rect(0, 40, pageWidth, 24, 'F')

  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('TOTAL SHARED', marginX, 48)
  doc.text('TOTAL PAID', 82, 48)
  doc.text('TOTAL PENDING', 116, 48)
  doc.text('SETTLED', 160, 48)

  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(`₱${totalAmount.toLocaleString()}`, marginX, 58)
  doc.text(`₱${totalPaid.toLocaleString()}`, 82, 58)
  doc.text(`₱${totalPending.toLocaleString()}`, 116, 58)
  doc.text(`${fullySettled}/${bills.length}`, 160, 58)

  let cursorY = 76

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > pageHeight - 20) {
      doc.addPage()
      cursorY = 20
    }
  }

  if (bills.length === 0) {
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(11)
    doc.setTextColor(120, 120, 120)
    doc.text('No shared bills yet.', marginX, cursorY + 10)
    cursorY += 20
  }

  bills.forEach(bill => {
    ensureSpace(28)

    const display = getSharedBillDisplay(bill)
    const style = SHARED_STATUS_STYLES[display.label]
    const [cr, cg, cb] = hexToRgb(bill.categoryColor)

    // Bill header bar
    doc.setFillColor(245, 247, 255)
    doc.rect(marginX, cursorY, pageWidth - marginX * 2, 10, 'F')
    doc.setFillColor(cr, cg, cb)
    doc.circle(marginX + 5, cursorY + 5, 2.2, 'F')

    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(bill.title, marginX + 11, cursorY + 6.5)
    const titleWidth = doc.getTextWidth(bill.title)

    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `${bill.categoryName} · Due ${format(new Date(bill.dueDate), 'MMM d, yyyy')} · Added by ${bill.addedBy}`,
      marginX + 11 + titleWidth + 4,
      cursorY + 6.5
    )

    // Status pill
    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(7.5)
    const label = display.label
    const textW = doc.getTextWidth(label)
    const pillW = textW + 6
    const pillH = 5.5
    const pillX = pageWidth - marginX - pillW - 34
    const pillY = cursorY + (10 - pillH) / 2
    doc.setFillColor(...style.bg)
    doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'F')
    doc.setTextColor(...style.text)
    doc.text(label, pillX + pillW / 2, pillY + pillH / 2 + 2.6, { align: 'center' })

    // Paid/total amount
    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 30, 30)
    doc.text(
      `₱${display.paid.toLocaleString()}/₱${bill.amount.toLocaleString()}`,
      pageWidth - marginX - 2,
      cursorY + 6.5,
      { align: 'right' }
    )

    cursorY += 13

    // Per-member contribution breakdown
    const body = bill.splits.map(s => [
      s.memberName,
      `₱${s.amount.toLocaleString()}`,
      '',
      s.isPaid && s.paidAt ? format(new Date(s.paidAt), 'MMM d, yyyy') : '—',
    ])

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['Member', 'Contribution', 'Status', 'Paid On']],
      body,
      styles: {
        font: FONT_NAME,
        fontSize: 9,
        textColor: [30, 30, 30],
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: { fillColor: [250, 251, 253] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 32, halign: 'right' },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 34, halign: 'center' },
      },
      didDrawCell: data => {
        if (data.section !== 'body' || data.column.index !== 2) return
        const split = bill.splits[data.row.index]
        if (!split) return
        const s = split.isPaid ? SHARED_STATUS_STYLES.PAID : SHARED_STATUS_STYLES.UNPAID
        const label = split.isPaid ? 'Paid' : 'Unpaid'
        doc.setFont(FONT_NAME, 'bold')
        doc.setFontSize(7.5)
        const textW = doc.getTextWidth(label)
        const pillW = textW + 6
        const pillH = 5.5
        const px = data.cell.x + (data.cell.width - pillW) / 2
        const py = data.cell.y + (data.cell.height - pillH) / 2
        doc.setFillColor(...s.bg)
        doc.roundedRect(px, py, pillW, pillH, 1.5, 1.5, 'F')
        doc.setTextColor(...s.text)
        doc.text(label, px + pillW / 2, py + pillH / 2 + 2.6, { align: 'center' })
      },
    })

    cursorY = (doc as any).lastAutoTable.finalY + 8
  })

  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} — Billify`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  doc.save(`${filename}-${format(now, 'yyyy-MM-dd')}.pdf`)
}