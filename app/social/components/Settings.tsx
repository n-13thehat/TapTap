'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type SettingsProps = {
  userId: string
}

export const Settings: React.FC<SettingsProps> = ({ userId }) => {
  const [theme, setTheme] = React.useState<'matrix' | 'dark' | 'light'>('matrix')
  const [notify, setNotify] = React.useState(true)
  const [privacy, setPrivacy] = React.useState<'public' | 'private'>('public')
  const [bio, setBio] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState('')

  React.useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('User').select('*').eq('id', userId).single()
      if (data) {
        setBio(data.bio ?? '')
        setEmail(data.email ?? '')
      }
    }
    load()
  }, [userId])

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('User')
        .update({ bio, email })
        .eq('id', userId)
      if (error) console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur">
        <h2 className="text-lg font-semibold text-teal-200">Settings</h2>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4"
      >
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-white/10">
            <TabsTrigger value="account" className="text-gray-300">Account</TabsTrigger>
            <TabsTrigger value="preferences" className="text-gray-300">Preferences</TabsTrigger>
            <TabsTrigger value="privacy" className="text-gray-300">Privacy</TabsTrigger>
          </TabsList>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="mt-4">
            <Card className="border-white/10 bg-black/60 p-4 space-y-3">
              <div>
                <label className="text-sm text-gray-300">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border-white/10 bg-black/60"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 border-white/10 bg-black/60 text-sm"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-teal-500/80 text-black hover:bg-teal-400"
              >
                {loading ? 'SavingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'Save Changes'}
              </Button>
            </Card>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="mt-4">
            <Card className="border-white/10 bg-black/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable Notifications</span>
                <Switch
                  checked={notify}
                  onCheckedChange={setNotify}
                  className="data-[state=checked]:bg-teal-500/70"
                />
              </div>

              <div>
                <span className="text-gray-300">Theme</span>
                <Select value={theme} onValueChange={(v: 'matrix' | 'dark' | 'light') => setTheme(v)}>
                  <SelectTrigger className="mt-2 w-[160px] border-white/10 bg-black/60 text-gray-200">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 text-gray-200">
                    <SelectItem value="matrix">Matrix</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  className="bg-teal-500/80 text-black hover:bg-teal-400"
                  onClick={() => {
                    if (theme === 'light') document.documentElement.classList.remove('dark')
                    else document.documentElement.classList.add('dark')
                  }}
                >
                  Apply Theme
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* PRIVACY TAB */}
          <TabsContent value="privacy" className="mt-4">
            <Card className="border-white/10 bg-black/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Profile Visibility</span>
                <Select
                  value={privacy}
                  onValueChange={(v: 'public' | 'private') => setPrivacy(v)}
                >
                  <SelectTrigger className="mt-2 w-[160px] border-white/10 bg-black/60 text-gray-200">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 text-gray-200">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="bg-teal-500/80 text-black hover:bg-teal-400"
                onClick={() =>
                  supabase
                    .from('User')
                    .update({ visibility: privacy })
                    .eq('id', userId)
                }
              >
                Save Privacy
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

