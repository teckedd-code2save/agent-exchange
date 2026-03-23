import { NextResponse } from 'next/server'; export async function GET() { return NextResponse.json({ message: 'This endpoint is deprecated. Use /api/v1/discovery or /api/v1/proxy instead.' }) }
