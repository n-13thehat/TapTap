'use client'
import Image from 'next/image'
import { useState } from 'react'

export interface Battle {
  id: string
  title: string
  hostChannel?: string
  thumbnailUrl?: string
  tier?: 'UNDERCARD' | 'MIDCARD' | 'HIGHCARD' | 'CHAMPIONSHIP'
  tapCoinCost?: number
  status?: 'UPCOMING' | 'LIVE' | 'ENDED'
  viewers?: number
}

interface BattleCardProps {
  battle: Battle
  unlocked?: Record<string, boolean>
  onUnlock?: (battle: Battle) => void
  onSelect?: (battle: Battle) => void
  onWager?: (battle: Battle) => void
}

const TIER_COLOR: Record<string, string> = {
  UNDERCARD: 'from-gray-600 to-gray-500',
  MIDCARD: 'from-teal-300 to-teal-400',
  HIGHCARD: 'from-teal-400 to-purple-500',
  CHAMPIONSHIP: 'from-purple-600 to-pink-500',
}

export default function BattleCard({
  battle,
  unlocked = {},
  onUnlock,
  onSelect,
  onWager,
}: BattleCardProps) {
  const [hovered, setHovered] = useState(false)
  const isUnlocked = !!unlocked[battle.id]
  const tierColor = TIER_COLOR[battle.tier || 'UNDERCARD']

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(battle)}
      className={`relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300`}
    >
      {/* thumbnail */}
      <div className='relative aspect-video w-full overflow-hidden'>
        {battle.thumbnailUrl ? (
          <Image
            src={battle.thumbnailUrl}
            alt={battle.title}
            fill
            className='object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-black to-gray-800' />
        )}
        <div className='absolute top-2 left-2 text-xs px-2 py-1 rounded-md bg-gradient-to-r text-black font-semibold'
             style={{ background: undefined }}>
          <span className={`px-2 py-1 rounded-md text-xs bg-gradient-to-r ${tierColor}`}>
            {battle.tier}
          </span>
        </div>
        {battle.status === 'LIVE' && (
          <div className='absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-red-600 text-white animate-pulse'>
            LIVE
          </div>
        )}
      </div>

      {/* body */}
      <div className='p-3 flex flex-col justify-between min-h-[100px]'>
        <div>
          <h3 className='font-semibold text-sm line-clamp-2 text-white/90'>{battle.title}</h3>
          <p className='text-xs text-white/60 mt-1'>
            {battle.hostChannel} Ã¢â‚¬Â¢ {battle.viewers?.toLocaleString() ?? 0} viewers
          </p>
        </div>

        <div className='mt-3 flex items-center justify-between'>
          <div className='text-xs text-white/60'>
            {isUnlocked ? (
              <span className='text-teal-300'>Unlocked</span>
            ) : (
              <>
                Unlock <span className='text-teal-200 font-semibold'>{battle.tapCoinCost} Taps</span>
              </>
            )}
          </div>

          <div className='flex gap-2'>
            {!isUnlocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUnlock?.(battle)
                }}
                className='text-xs px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold hover:scale-105 transition-transform'
              >
                Unlock
              </button>
            )}
            {battle.status === 'LIVE' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onWager?.(battle)
                }}
                className='text-xs px-3 py-1 rounded-full border border-white/10 text-white/80 hover:bg-white/10'
              >
                Wager
              </button>
            )}
          </div>
        </div>
      </div>

      {/* hover overlay */}
      {hovered && !isUnlocked && (
        <div className='absolute inset-0 bg-black/70 flex items-center justify-center opacity-90 transition-opacity'>
          <div className='text-center'>
            <p className='text-sm mb-2 text-white/80'>Preview only</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUnlock?.(battle)
              }}
              className='px-4 py-2 rounded-md bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold hover:scale-105 transition-transform'
            >
              Unlock {battle.tapCoinCost} Taps
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
