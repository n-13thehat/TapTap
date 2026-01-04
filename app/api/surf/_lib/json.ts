import { NextResponse } from 'next/server';

export function ok(data: any, init?: any) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function server(message = 'Internal error', detail?: unknown) {
  if (detail) console.error('[surf api]', message, detail);
  return NextResponse.json({ error: message }, { status: 500 });
}
