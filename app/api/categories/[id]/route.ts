import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateCategoryInput } from '@/lib/validation'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.category.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const body = await req.json()
    const validation = validateCategoryInput(body)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

    const category = await prisma.category.update({
      where: { id },
      data: validation.data,
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Category PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.category.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}