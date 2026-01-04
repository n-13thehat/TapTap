#!/usr/bin/env python3
"""
Transcribe an audio file to MIDI + Stemstation chart using Spotify's basic-pitch.

Usage:
  python3 tools/transcribe-basicpitch.py <audio_path> <trackId> <difficulty> [offsetMs]

Outputs:
  - app/stemstation/midi/<sanitized-trackId>.mid
  - app/stemstation/charts/<sanitized-trackId>.json

Dependencies:
  pip install basic-pitch==0.4.0 pretty_midi
  (Requires TensorFlow-compatible Python, e.g., 3.10)
"""
import json
import os
import sys
import pathlib
from typing import List, Dict

def sanitize_id(track_id: str) -> str:
    return "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in track_id)

def lane_for_midi(midi_note: int) -> int:
    # Map midi pitches to 4 lanes; tweak if needed
    return max(0, min(3, (midi_note - 36) // 12))

def build_chart_from_midi(pm, track_id: str, title: str, artist: str, difficulty: str, offset_ms: int):
    notes = []
    for inst in pm.instruments:
        for n in inst.notes:
            start_ms = int(round(n.start * 1000)) + offset_ms
            end_ms = int(round(n.end * 1000)) + offset_ms
            lane = lane_for_midi(n.pitch)
            if end_ms - start_ms >= 350:
                notes.append({
                    "timeMs": start_ms,
                    "lane": lane,
                    "type": "hold",
                    "endTimeMs": end_ms,
                })
            else:
                notes.append({
                    "timeMs": start_ms,
                    "lane": lane,
                    "type": "tap",
                })
    notes.sort(key=lambda x: x["timeMs"])
    # basic-pitch stores tempo events; grab first if present
    bpm = None
    if pm.estimate_tempo():
        bpm = float(pm.estimate_tempo())
    return {
        "songId": track_id,
        "title": title,
        "artist": artist,
        "bpm": bpm,
        "offsetMs": offset_ms,
        "difficulty": difficulty,
        "notes": notes,
    }

def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    audio_path = sys.argv[1]
    track_id = sys.argv[2]
    difficulty = sys.argv[3].lower()
    offset_ms = int(sys.argv[4]) if len(sys.argv) > 4 else 0

    try:
        from basic_pitch.inference import predict
        from basic_pitch import ICASSP_2022_MODEL_PATH
        import pretty_midi
    except ImportError as e:
        print("basic-pitch not installed. Install with: pip install basic-pitch==0.4.0 pretty_midi")
        sys.exit(1)

    if not os.path.exists(audio_path):
        print(f"Audio not found: {audio_path}")
        sys.exit(1)

    sanitized = sanitize_id(track_id)
    charts_dir = pathlib.Path("app/stemstation/charts")
    midi_dir = pathlib.Path("app/stemstation/midi")
    charts_dir.mkdir(parents=True, exist_ok=True)
    midi_dir.mkdir(parents=True, exist_ok=True)

    print(f"Transcribing {audio_path} -> {sanitized}.mid/.json using basic-pitch")
    midi_out = midi_dir / f"{sanitized}.mid"
    predict(audio_path, midi_out, save_midi=True, sonify_midi=False, model_or_model_path=ICASSP_2022_MODEL_PATH)

    pm = pretty_midi.PrettyMIDI(str(midi_out))
    chart = build_chart_from_midi(pm, track_id, pathlib.Path(audio_path).stem, "STEMSTATION", difficulty, offset_ms)

    chart_out = charts_dir / f"{sanitized}.json"
    chart_out.write_text(json.dumps(chart, indent=2))
    print(f"Wrote chart: {chart_out} (notes={len(chart['notes'])})")

if __name__ == "__main__":
    main()
