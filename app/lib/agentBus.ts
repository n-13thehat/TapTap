"use client";
import React from "react";
import { useContext, createContext, useMemo } from "react";

export const AGENT_EVENTS = {
  TRACK_PLAYED: "AGENT_EVENT_TRACK_PLAYED",
  TRACK_SAVED: "AGENT_EVENT_TRACK_SAVED",
  POST_PUBLISHED: "AGENT_EVENT_POST_PUBLISHED",
  BATTLE_VOTE: "AGENT_EVENT_BATTLE_VOTE",
  PURCHASE_COMPLETED: "AGENT_EVENT_PURCHASE_COMPLETED",
  WALLET_SWAP: "AGENT_EVENT_WALLET_SWAP",
  TAPPASS_GRANTED: "AGENT_EVENT_TAPPASS_GRANTED",
  TASK_COMPLETED: "AGENT_EVENT_TASK_COMPLETED",
} as const;

export type AgentEventKey = (typeof AGENT_EVENTS)[keyof typeof AGENT_EVENTS];

export type AgentEventPayload = {
  [AGENT_EVENTS.TRACK_PLAYED]: { trackId: string; source?: string };
  [AGENT_EVENTS.TRACK_SAVED]: { trackId: string };
  [AGENT_EVENTS.POST_PUBLISHED]: { postId: string };
  [AGENT_EVENTS.BATTLE_VOTE]: { battleId: string; voteFor: string };
  [AGENT_EVENTS.PURCHASE_COMPLETED]: { productId: string; amountCents?: number };
  [AGENT_EVENTS.WALLET_SWAP]: { from: string; to: string; amount: number };
  [AGENT_EVENTS.TAPPASS_GRANTED]: { userId: string; feature: string };
  [AGENT_EVENTS.TASK_COMPLETED]: { task: string };
};

type AgentEventListener<K extends AgentEventKey> = (payload: AgentEventPayload[K]) => void;

export class AgentBus extends EventTarget {
  private registered = false;

  emit<K extends AgentEventKey>(eventName: K, payload: AgentEventPayload[K]) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  }

  on<K extends AgentEventKey>(eventName: K, listener: AgentEventListener<K>) {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      listener(detail);
    };
    this.addEventListener(eventName, handler);
    return () => this.removeEventListener(eventName, handler);
  }

  registerGlobalAgents() {
    if (this.registered) return;
    this.registered = true;
    this.on(AGENT_EVENTS.TRACK_PLAYED, ({ trackId }) => {
      console.debug("[Prism] TRACK_PLAYED", trackId);
    });
    this.on(AGENT_EVENTS.TRACK_SAVED, ({ trackId }) => {
      console.debug("[Hope] TRACK_SAVED", trackId);
    });
    this.on(AGENT_EVENTS.PURCHASE_COMPLETED, ({ productId, amountCents }) => {
      console.debug("[Treasure] PURCHASE_COMPLETED", productId, amountCents);
    });
    this.on(AGENT_EVENTS.BATTLE_VOTE, ({ battleId }) => {
      console.debug("[Rune] BATTLE_VOTE", battleId);
    });
    this.on(AGENT_EVENTS.TAPPASS_GRANTED, ({ userId, feature }) => {
      console.debug("[Serenity] TAPPASS_GRANTED", userId, feature);
    });
  }
}

const AgentBusContext = createContext<AgentBus | null>(null);

export function AgentBusProvider({ children }: { children: React.ReactNode }) {
  const bus = useMemo(() => {
    const instance = new AgentBus();
    instance.registerGlobalAgents();
    return instance;
  }, []);
  return React.createElement(AgentBusContext.Provider, { value: bus }, children);
}

export function useAgentBus() {
  const bus = useContext(AgentBusContext);
  if (!bus) {
    throw new Error("AgentBusProvider missing");
  }
  return bus;
}



