import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'loaded ✅' : 'missing ❌')

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    })

    const categoryList = categories.map(c => `{ "id": "${c.id}", "name": "${c.name}" }`).join(', ')
    const currentYear = new Date().getFullYear()

    const prompt = `
You are a bill parser. Extract bill information from the user's input and return ONLY a valid JSON object, no explanation, no markdown, no backticks.

User's categories: [${categoryList}]
Current year: ${currentYear}
Today's date: ${new Date().toISOString().split('T')[0]}

User input: "${text}"

Rules:
- Match the bill description to the closest category from the list above by name
- If no category matches, set categoryId to null
- Amount should be a number only, no currency symbols
- dueDate must be in YYYY-MM-DD format, assume current year if not specified
- title should be a clean short name for the bill (e.g. "Electricity Bill", "Water Bill", "Internet Bill")
- If you cannot determine a field, set it to null

Return this exact format:
{
  "title": "string",
  "amount": number or null,
  "dueDate": "YYYY-MM-DD" or null,
  "categoryId": "string" or null
}
`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    console.log('Gemini status:', geminiRes.status)
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2))

    // Check if Gemini returned an error
    if (!geminiRes.ok || geminiData.error) {
      console.error('Gemini API error:', geminiData.error)
      return NextResponse.json({ 
        error: `Gemini error: ${geminiData.error?.message ?? 'Unknown error'}` 
      }, { status: 500 })
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('Raw text:', raw)

    if (!raw) {
      return NextResponse.json({ error: 'Gemini returned empty response' }, { status: 500 })
    }

    const cleaned = raw.replace(/```json|```/g, '').trim()
    console.log('Cleaned:', cleaned)

    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ parsed, categories })
  } catch (error) {
    console.error('AI parse error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}