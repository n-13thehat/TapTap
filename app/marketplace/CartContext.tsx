"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = { id: string; title: string; priceCents: number };

type CartCtx = {
  items: CartItem[];
  add: (it: CartItem) => void;
  remove: (id: string) => void;
  totalCents: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const totalCents = useMemo(() => items.reduce((a, b) => a + (b.priceCents || 0), 0), [items]);
  const add = (it: CartItem) => setItems((arr) => (arr.some((x) => x.id === it.id) ? arr : [...arr, it]));
  const remove = (id: string) => setItems((arr) => arr.filter((x) => x.id !== id));
  return <Ctx.Provider value={{ items, add, remove, totalCents, open, setOpen }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used in CartProvider");
  return ctx;
}

export function CartDrawer() {
  const { items, totalCents, remove, open, setOpen } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-sm overflow-auto border-l border-white/10 bg-black p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-teal-300">Cart</div>
          <button onClick={() => setOpen(false)} className="rounded border border-white/10 px-2 py-1 text-sm hover:bg-white/10">Close</button>
        </div>
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
              <span className="truncate">{it.title}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">${(it.priceCents / 100).toFixed(2)}</span>
                <button onClick={() => remove(it.id)} className="rounded border border-white/10 px-2 py-0.5 text-xs hover:bg-white/10">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm text-white/80">
          <span>Total</span>
          <span className="font-mono">${(totalCents / 100).toFixed(2)}</span>
        </div>
        <button onClick={async () => { alert('Checkout (stub) complete!'); setOpen(false); }} className="mt-3 w-full rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-black hover:bg-teal-500">Checkout</button>
      </div>
    </div>
  );
}

