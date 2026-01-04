'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { uploadMedia, supabase } from '../supabaseClient'

type ProfileProps = {
  userId: string
  isMe?: boolean
}

export const Profile: React.FC<ProfileProps> = ({ userId, isMe }) => {
  const [user, setUser] = React.useState<any>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  })

  React.useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.from('User').select('*').eq('id', userId).single()
      if (active && data) {
        setUser(data)
        setForm({
          name: data.name,
          bio: data.bio ?? '',
          avatarUrl: data.avatarUrl ?? '',
          bannerUrl: data.bannerUrl ?? ''
        })
      }
    }
    load()
    return () => {
      active = false
    }
  }, [userId])

  const handleSave = async () => {
    if (!isMe) return
    setSaving(true)
    try {
      const update = {
        name: form.name,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        bannerUrl: form.bannerUrl
      }
      const { error } = await supabase.from('User').update(update).eq('id', userId)
      if (error) console.error(error)
      else setUser({ ...user, ...update })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: 'avatarUrl' | 'bannerUrl', file: File) => {
    const url = await uploadMedia(file, field === 'avatarUrl' ? 'avatars' : 'banners')
    setForm((prev) => ({ ...prev, [field]: url }))
  }

  if (!user)
    return (
      <div className="flex h-40 items-center justify-center text-gray-400">Loading profileÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>
    )

  return (
    <div className="flex-1 min-h-screen bg-black/40">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt="banner"
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-black via-[#001b1a] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
      </div>

      {/* Avatar + header */}
      <div className="-mt-12 flex items-end gap-4 px-4">
        <Avatar className="h-24 w-24 border-4 border-black">
          <AvatarImage src={user.avatarUrl ?? '/placeholder/avatar.png'} />
          <AvatarFallback>{user.name?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            {user.name}
            {user.verified && (
              <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-300">
                Verified
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">@{user.handle}</div>
        </div>
        {isMe && (
          <Button
            onClick={() => setEditOpen(true)}
            variant="outline"
            className="ml-auto border-white/20 text-gray-300 hover:bg-white/10"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Bio */}
      {user.bio && <p className="px-4 pt-4 text-sm text-gray-200">{user.bio}</p>}

      {/* Favorites / stats placeholder */}
      <div className="px-4 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-teal-300">Top Favorites</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="border-white/10 bg-black/60 p-3 text-gray-400 text-sm">
            Favorite slots will appear here.
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editOpen && (
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-lg border border-white/10 bg-black/80 text-gray-200 backdrop-blur-lg">
              <DialogHeader>
                <DialogTitle className="text-teal-300">Edit Profile</DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="border-white/10 bg-black/60"
                />
                <Textarea
                  placeholder="Bio"
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="h-24 border-white/10 bg-black/60 text-sm"
                />

                {/* Avatar upload */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="avatar-upload"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload('avatarUrl', f)
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    Upload Avatar
                  </Button>
                  {form.avatarUrl && (
                    <img
                      src={form.avatarUrl}
                      alt="avatar preview"
                      className="h-10 w-10 rounded-full border border-white/10"
                    />
                  )}
                </div>

                {/* Banner upload */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="banner-upload"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload('bannerUrl', f)
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    Upload Banner
                  </Button>
                  {form.bannerUrl && (
                    <img
                      src={form.bannerUrl}
                      alt="banner preview"
                      className="h-10 w-20 rounded border border-white/10 object-cover"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-teal-400"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-teal-500/80 text-black hover:bg-teal-400"
                  >
                    {saving ? 'SavingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'Save'}
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}

