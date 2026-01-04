"use client"
import { Fragment, HTMLAttributes } from 'react'
import { Menu, Transition } from '@headlessui/react'
import clsx from 'clsx'

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block text-left">{children}</div>
}

export function DropdownMenuTrigger({ children, className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return (
    <Menu>
      <Menu.Button className={clsx('inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10', className)} {...props}>
        {children}
      </Menu.Button>
    </Menu>
  )
}

export function DropdownMenuContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className={clsx('absolute right-0 z-50 mt-2 min-w-[10rem] origin-top-right rounded-md border border-white/10 bg-black/80 p-1 text-sm text-white shadow-lg backdrop-blur', className)}>
        {children}
      </Menu.Items>
    </Transition>
  )
}

export function DropdownMenuItem({ children, className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button className={clsx('w-full select-none rounded-sm px-2 py-1.5 text-left outline-none', active ? 'bg-white/10' : 'bg-transparent', className)} {...props}>
          {children}
        </button>
      )}
    </Menu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('px-2 py-1.5 text-xs text-white/60', className)}>{children}</div>
}


