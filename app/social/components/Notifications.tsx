'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Notifications() {
  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader><CardTitle className="text-white">Notifications</CardTitle></CardHeader>
      <CardContent>
        <ul className="text-white/70 text-sm space-y-2">
          <li>?? new follower: @trinity</li>
          <li>?? @neo liked your post</li>
          <li>?? @morpheus replied to your thread</li>
        </ul>
      </CardContent>
    </Card>
  );
}
