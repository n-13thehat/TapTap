export async function POST(request: Request) {
  const { action } = await request.json();
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}