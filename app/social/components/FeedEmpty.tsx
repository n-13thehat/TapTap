import { Card, CardContent } from '@/components/ui/card'
export function FeedEmpty() {
  return (
    <Card className="bg-black/40 border-white/10">
      <CardContent className="py-14">
        <div className="text-center space-y-2">
          <div className="text-2xl text-white font-semibold">No posts yet</div>
          <div className="text-white/60">Start the conversation with your first post.</div>
        </div>
      </CardContent>
    </Card>
  )
}
