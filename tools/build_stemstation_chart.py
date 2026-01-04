import sys
import json
from pathlib import Path
from typing import List, Dict, Literal

import pretty_midi

StemName = Literal["melody", "drums", "vocals"]
Difficulty = Literal["easy", "normal", "expert"]

# ---------- Helpers ----------

class NoteEvent:
    def __init__(self, time_ms: float, duration_ms: float, pitch: int, lane: int):
        self.time_ms = time_ms
        self.duration_ms = duration_ms
        self.pitch = pitch
        self.lane = lane

    def to_dict(self) -> Dict:
        return {
            "timeMs": round(self.time_ms),
            "durationMs": round(self.duration_ms),
            "pitch": int(self.pitch),
            "lane": int(self.lane),
        }

def load_midi_notes(path: Path) -> List[NoteEvent]:
    """
    Load a MIDI file and flatten all tracks into NoteEvents (time+duration+pitch).
    """
    pm = pretty_midi.PrettyMIDI(str(path))
    events: List[NoteEvent] = []

    for inst in pm.instruments:
        for n in inst.notes:
            time_ms = n.start * 1000.0
            duration_ms = (n.end - n.start) * 1000.0
            pitch = n.pitch
            lane = map_pitch_to_lane(pitch)
            events.append(NoteEvent(time_ms, duration_ms, pitch, lane))

    events.sort(key=lambda e: e.time_ms)
    return events

def map_pitch_to_lane(pitch: int) -> int:
    """
    Map MIDI pitch to lane index [0-3] (4-lane StemStation).
    Tweak as needed per stem; this is a simple range-based mapper.
    """
    if pitch < 50:
        return 0
    elif pitch < 60:
        return 1
    elif pitch < 72:
        return 2
    else:
        return 3

def thin_notes_for_difficulty(
    notes: List[NoteEvent],
    difficulty: Difficulty,
    min_spacing_ms_easy=260,
    min_spacing_ms_normal=160,
    min_spacing_ms_expert=80,
) -> List[NoteEvent]:
    """
    Take the full 'expert' style note list and produce fewer notes for easier
    difficulties, based on minimum spacing.
    """
    if difficulty == "expert":
        min_gap = min_spacing_ms_expert
    elif difficulty == "normal":
        min_gap = min_spacing_ms_normal
    else:
        min_gap = min_spacing_ms_easy

    out: List[NoteEvent] = []
    last_time_by_lane: Dict[int, float] = {}

    for note in notes:
        lane = note.lane
        last_time = last_time_by_lane.get(lane, -1e9)
        if note.time_ms - last_time < min_gap:
            if difficulty in ("easy", "normal"):
                continue

        out.append(note)
        last_time_by_lane[lane] = note.time_ms

    return out

def quantize_notes_to_grid(notes: List[NoteEvent], grid_ms: float) -> List[NoteEvent]:
    """
    Quantize note start times to a fixed ms grid.
    """
    for n in notes:
        n.time_ms = round(n.time_ms / grid_ms) * grid_ms
    return notes

# ---------- Main build function ----------

def build_chart_for_song(
    track_id: str,
    song_name: str,
    artist: str,
    bpm: float,
    midi_dir: Path,
    output_path: Path,
) -> None:
    """
    Look for 3 MIDI stems in midi_dir for this song:
      - <song_name>_melody.mid
      - <song_name>_drums.mid
      - <song_name>_vocals.mid
    Build a Rock Band-like chart JSON.
    """
    song_slug = song_name.replace(" ", "_")

    def midi_path(stem: StemName) -> Path:
        return midi_dir / f"{song_slug}_{stem}.mid"

    stems: Dict[StemName, Dict] = {}

    for stem_name in ("melody", "drums", "vocals"):
        path = midi_path(stem_name)  # type: ignore[arg-type]
        if not path.exists():
            continue

        all_notes = load_midi_notes(path)

        beat_ms = 60000.0 / bpm
        grid_ms = beat_ms / 4.0  # 16th note grid
        quantized = quantize_notes_to_grid(all_notes, grid_ms)

        expert_notes = thin_notes_for_difficulty(
            quantized, "expert",
            min_spacing_ms_expert=80,
        )
        normal_notes = thin_notes_for_difficulty(
            quantized, "normal",
            min_spacing_ms_normal=150,
        )
        easy_notes = thin_notes_for_difficulty(
            quantized, "easy",
            min_spacing_ms_easy=260,
        )

        stems[stem_name] = {
          "midiFile": str(path).replace("\\", "/"),
          "difficulties": {
            "easy": {"notes": [n.to_dict() for n in easy_notes]},
            "normal": {"notes": [n.to_dict() for n in normal_notes]},
            "expert": {"notes": [n.to_dict() for n in expert_notes]},
          },
        }

    chart = {
        "trackId": track_id,
        "songName": song_name,
        "artist": artist,
        "bpm": bpm,
        "audioOffsetMs": 0,
        "stems": stems,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(chart, f, indent=2)

    print(f"Wrote chart JSON: {output_path}")

if __name__ == "__main__":
    """
    Usage:
      python tools/build_stemstation_chart.py \
        "local:0:SongName" \
        "Song Name" \
        "vx9" \
        120 \
        app/stemstation/midi \
        app/stemstation/charts/SongName_chart.json
    """
    if len(sys.argv) != 7:
        print("Usage: build_stemstation_chart.py <track_id> <song_name> <artist> <bpm> <midi_dir> <output_json>")
        sys.exit(1)

    track_id = sys.argv[1]
    song_name = sys.argv[2]
    artist = sys.argv[3]
    bpm = float(sys.argv[4])
    midi_dir = Path(sys.argv[5])
    output_json = Path(sys.argv[6])

    build_chart_for_song(track_id, song_name, artist, bpm, midi_dir, output_json)
