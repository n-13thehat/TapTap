'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import type { Post } from '@/app/lib/types/social';

export function Composer({ onPost }: { onPost: (p: Post) => void }) {
  const [text, setText] = useState(''); const [tag] = useState('#taptap');
  const canPost = text.trim().length > 0 && text.length <= 280;

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10"><AvatarFallback>YOU</AvatarFallback></Avatar>
          <div className="flex-1 space-y-3">
            <Textarea value={text} onChange={e=>setText(e.target.value)} maxLength={280}
              placeholder="Share somethingÃ¯Â¿Â½" className="bg-black/40 border-white/10" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Badge variant="outline" className="border-white/10">{tag}</Badge>
                <span>{text.length} / 280</span>
              </div>
              <Button disabled={!canPost} onClick={()=>{
                const p: Post = { id: Math.random().toString(36).slice(2,10),
                  author: 'you', text: text + ' ' + tag, likes: 0, replies: 0, ts: Date.now()/1000|0 };
                onPost(p); setText('');
              }} className="bg-teal-600 hover:bg-teal-500">
                <Send className="mr-2 h-4 w-4" /> Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
