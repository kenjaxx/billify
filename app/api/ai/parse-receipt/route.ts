// app/api/ai/parse-receipt/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/rate-limit'

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args)
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (await isRateLimited(user.id, 5)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    const { fileBase64, mimeType } = await req.json()
    if (!fileBase64 || !mimeType) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({ where: { userId: user.id } })
    const categoryList = categories.map(c => `{ "id": "${c.id}", "name": "${c.name}" }`).join(', ')
    const currentYear = new Date().getFullYear()

    const prompt = `
You are a receipt/bill scanner. Look at the attached image or PDF and extract EVERY separate billable line item — a single document may contain multiple distinct charges (e.g. rent, electricity, water, internet) that should each become their own bill. Return ONLY a valid JSON array, no explanation, no markdown, no backticks.

User's categories: [${categoryList}]
Current year: ${currentYear}
Today's date: ${new Date().toISOString().split('T')[0]}

Rules:
- Identify each distinct charge/service line as its own item (e.g. "Monthly Room Rental", "Electric Bill", "Water Bill", "Internet Bill" are 4 separate items even if on one statement)
- Skip any line item with an amount of 0 or that is not an actual charge
- Match each item to the closest category from the list above by name
- If no category matches for an item, set categoryId to null
- Amount should be a number only, no currency symbols or commas
- dueDate must be in YYYY-MM-DD format — use the document's due date if shown, otherwise the statement date, applied to every item unless a line clearly has its own separate due date. If no date is visible, set to null
- title should be a clean short name per item (e.g. "Lemon House — Monthly Rent", "Lemon House — Electric Bill")
- If the document only contains a single charge, return an array with just that one item
- If the document is not a bill/receipt or is unreadable, return an empty array

Return this exact format:
[
  {
    "title": "string" or null,
    "amount": number or null,
    "dueDate": "YYYY-MM-DD" or null,
    "categoryId": "string" or null
  }
]
`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: fileBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    devLog('Receipt Gemini status:', geminiRes.status)

    if (!geminiRes.ok || geminiData.error) {
      console.error('Gemini API error:', geminiData.error)
      return NextResponse.json({
        error: `Gemini error: ${geminiData.error?.message ?? 'Unknown error'}`
      }, { status: 500 })
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) {
      return NextResponse.json({ error: 'Could not read the receipt' }, { status: 500 })
    }

    const cleaned = raw.replace(/```json|```/g, '').trim()
    let parsedItems = JSON.parse(cleaned)
    if (!Array.isArray(parsedItems)) parsedItems = [parsedItems]

    return NextResponse.json({ items: parsedItems, categories })
  } catch (error) {
    console.error('AI receipt parse error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to read receipt' }, { status: 500 })
  }
}