'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Thread } from '@/app/lib/types/social';

export function Messages({ threads }: { threads: Thread[] }) {
  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader><CardTitle className="text-white">Messages</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-2">
          <div className="space-y-3">
            {threads.map(t=>(
              <div key={t.id} className="rounded-lg border border-white/10 p-3">
                <div className="text-white font-medium">{t.title}</div>
                <div className="text-white/60 text-sm">
                  {t.messages.slice(-1)[0]?.from}: {t.messages.slice(-1)[0]?.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
