import { revalidatePath } from 'next/cache';
import { auth } from '@/auth.config';

async function isAdmin() {
  try {
    const session = await auth();
    const role = (session as any)?.user?.role;
    return role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    revalidatePath('/api/home/featured');
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


