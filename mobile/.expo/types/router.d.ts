/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/agents` | `/(tabs)/battles` | `/(tabs)/chat` | `/(tabs)/home` | `/(tabs)/music` | `/(tabs)/profile` | `/(tabs)/social` | `/_sitemap` | `/agents` | `/agents/chat` | `/battles` | `/battles\[id]` | `/battles\create` | `/battles\leaderboard` | `/chat` | `/home` | `/marketplace` | `/marketplace\buy\[id]` | `/marketplace\purchases` | `/marketplace\track\[id]` | `/music` | `/player/now-playing` | `/player\lyrics` | `/player\queue` | `/profile` | `/social` | `/social\create` | `/social\post\[id]` | `/social\profile\[id]` | `/stemstation` | `/stemstation\editor\[id]` | `/stemstation\remix` | `/surf` | `/surf\channel\[id]` | `/surf\watch\[id]`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
