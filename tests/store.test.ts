import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/stores/player";

const makeTrack = (id: string) => ({
  id,
  title: `Track ${id}`,
  audio_url: `https://example.com/${id}.mp3`,
});

beforeEach(() => {
  usePlayerStore.setState({
    queue: [],
    current: null,
    index: 0,
    isPlaying: false,
  });
});

describe("player store", () => {
  it("toggles play/pause", () => {
    const s = usePlayerStore.getState();
    expect(s.isPlaying).toBe(false);
    s.play();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    s.pause();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it("skips next and prev", () => {
    const first = makeTrack("1");
    const second = makeTrack("2");
    usePlayerStore.setState({
      queue: [first, second],
      current: first,
      index: 0,
    });

    const s = usePlayerStore.getState();
    expect(s.index).toBe(0);
    s.skipNext();
    expect(usePlayerStore.getState().index).toBe(1);
    s.skipPrev();
    expect(usePlayerStore.getState().index).toBe(0);
  });
});
