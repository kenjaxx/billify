import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { format } from 'date-fns'

type Bill = {
  title: string
  amount: number
  dueDate: string
  status: string
  category: { name: string; icon: string | null }
  notes?: string | null
}

export function exportToCSV(bills: Bill[], filename = 'bills') {
  const data = bills.map(b => ({
    Title: b.title,
    Category: b.category.name,
    Amount: b.amount,
    'Due Date': format(new Date(b.dueDate), 'MMM d, yyyy'),
    Status: b.status,
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

export function exportToPDF(bills: Bill[], filename = 'bills') {
  const doc = new jsPDF()
  const now = new Date()

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, 220, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Billify', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text('Bill Report', 14, 26)
  doc.text(`Generated: ${format(now, 'MMMM d, yyyy')}`, 14, 33)

  // Summary stats
  const total = bills.reduce((sum, b) => sum + b.amount, 0)
  const paid = bills.filter(b => b.status === 'PAID').length
  const unpaid = bills.filter(b => b.status === 'UNPAID').length
  const overdue = bills.filter(b => b.status === 'OVERDUE').length

  doc.setFillColor(22, 27, 39)
  doc.rect(0, 44, 220, 24, 'F')

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('TOTAL AMOUNT', 14, 52)
  doc.text('PAID', 70, 52)
  doc.text('UNPAID', 110, 52)
  doc.text('OVERDUE', 155, 52)

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(`₱${total.toLocaleString()}`, 14, 62)
  doc.text(String(paid), 70, 62)
  doc.text(String(unpaid), 110, 62)
  doc.text(String(overdue), 155, 62)

  // Table
  autoTable(doc, {
    startY: 76,
    head: [['Title', 'Category', 'Amount', 'Due Date', 'Status']],
    body: bills.map(b => [
      b.title,
      `${b.category.icon ?? ''} ${b.category.name}`,
      `₱${b.amount.toLocaleString()}`,
      format(new Date(b.dueDate), 'MMM d, yyyy'),
      b.status,
    ]),
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 255],
    },
    columnStyles: {
      2: { halign: 'right' },
      4: { halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.text[0]
        if (status === 'PAID') data.cell.styles.textColor = [52, 211, 153]
        else if (status === 'OVERDUE') data.cell.styles.textColor = [248, 113, 113]
        else data.cell.styles.textColor = [251, 191, 36]
      }
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} — Billify`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    )
  }

  doc.save(`${filename}-${format(now, 'yyyy-MM-dd')}.pdf`)
}