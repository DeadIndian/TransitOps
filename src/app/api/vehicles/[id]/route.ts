import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ id });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  return NextResponse.json({ id, ...body });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ id }, { status: 200 });
}
