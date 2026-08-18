import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { format } from 'date-fns'

type BillStatus = 'PAID' | 'UNPAID' | 'OVERDUE'

type Bill = {
  title: string
  amount: number
  dueDate: string
  status: BillStatus
  isRecurring?: boolean
  notes?: string | null
  categoryId?: string
  category: { name: string; icon: string | null; color?: string | null }
}

// ── CSV export ─────────────────────────────────────────────────────────────

export function exportToCSV(bills: Bill[], filename = 'bills') {
  const data = bills.map(b => ({
    Title: b.title,
    Category: b.category.name,
    Amount: b.amount,
    'Due Date': format(new Date(b.dueDate), 'MMM d, yyyy'),
    Status: b.status,
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

// ── PDF export ─────────────────────────────────────────────────────────────
// jsPDF's built-in fonts (Helvetica etc.) only support the WinAnsi character
// set, which does not include the ₱ (peso) sign or most accented characters.
// Without a real Unicode font embedded, those glyphs render as garbage boxes.
// We embed a subset of Noto Sans (Regular + Bold) at export time to fix this.

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

async function embedUnicodeFont(doc: jsPDF) {
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
  const fallback: [number, number, number] = [148, 163, 184] // slate-400
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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const marginX = 14
  const now = new Date()

  await embedUnicodeFont(doc)

  // ── Header ──────────────────────────────────────────────────────────────
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

  // ── Summary stats ───────────────────────────────────────────────────────
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

  // ── Category groups ─────────────────────────────────────────────────────
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

    // Category header bar: color dot + name + count + subtotal
    const [cr, cg, cb] = hexToRgb(group.color)
    doc.setFillColor(245, 247, 255)
    doc.rect(marginX, cursorY, pageWidth - marginX * 2, 10, 'F')
    doc.setFillColor(cr, cg, cb)
    doc.circle(marginX + 5, cursorY + 5, 2.2, 'F')

    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(group.name, marginX + 11, cursorY + 6.5)
    const nameWidth = doc.getTextWidth(group.name) // measure at the size it was drawn

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
    const head = hasNotes
      ? ['Title', 'Due Date', 'Status', 'Amount', 'Notes']
      : ['Title', 'Due Date', 'Status', 'Amount']
    const body = group.bills.map(b => {
      const row = [
        b.title,
        format(new Date(b.dueDate), 'MMM d, yyyy'),
        b.status,
        `₱${b.amount.toLocaleString()}`,
      ]
      if (hasNotes) row.push(b.notes && b.notes.trim() ? b.notes : '—')
      return row
    })

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
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 28 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 26, halign: 'right' },
        ...(hasNotes ? { 4: { cellWidth: 42 } } : {}),
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold'
        }
        // Text is repainted manually in didDrawCell for these columns —
        // hide the default text so it isn't drawn twice.
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.text = []
        }
      },
      didDrawCell: data => {
        if (data.section !== 'body') return
        const bill = group.bills[data.row.index]
        if (!bill) return

        // Status pill
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

        // Recurring badge appended after the title
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

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  })

  // ── Footer ──────────────────────────────────────────────────────────────
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
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