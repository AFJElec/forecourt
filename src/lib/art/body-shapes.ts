/** Shared side-profile geometry for body types (used by demo renders and UI icons). */
import type { BodyType } from "@/types/vehicle";

type P = [number, number, number?]; // x, y, corner radius

export interface Shape {
  profile: P[];          // upper outline from front-bottom to rear-bottom (car faces left)
  glass: P[];            // greenhouse polygon
  bottomY: number;
  wheels: [number, number];
  wheelR: number;
  pillarX: number;       // B-pillar
  headlight: [number, number];
  taillight: [number, number];
  convertible?: boolean;
}

export const G = 470; // ground line

export const shapes: Record<BodyType, Shape> = {
  hatchback: {
    profile: [[108, 430, 18], [112, 372, 30], [190, 340, 40], [298, 326, 20], [392, 232, 40], [596, 226, 46], [676, 318, 20], [688, 336, 10], [690, 430, 16]],
    glass: [[312, 322, 8], [398, 244, 16], [592, 240, 22], [660, 318, 8]],
    bottomY: 438, wheels: [225, 572], wheelR: 58, pillarX: 488, headlight: [116, 362], taillight: [672, 330],
  },
  saloon: {
    profile: [[80, 432, 18], [86, 378, 30], [170, 346, 44], [300, 336, 18], [386, 246, 40], [548, 240, 44], [644, 318, 26], [712, 322, 14], [718, 432, 16]],
    glass: [[318, 330, 8], [392, 256, 16], [544, 252, 20], [624, 322, 8]],
    bottomY: 440, wheels: [208, 590], wheelR: 58, pillarX: 470, headlight: [90, 366], taillight: [700, 332],
  },
  estate: {
    profile: [[80, 432, 18], [86, 378, 30], [170, 346, 44], [300, 336, 18], [386, 244, 40], [668, 236, 30], [712, 316, 14], [718, 432, 16]],
    glass: [[318, 330, 8], [392, 254, 16], [662, 248, 16], [698, 320, 8]],
    bottomY: 440, wheels: [208, 590], wheelR: 58, pillarX: 470, headlight: [90, 366], taillight: [706, 330],
  },
  suv: {
    profile: [[98, 420, 18], [102, 350, 30], [180, 316, 40], [298, 302, 18], [372, 196, 36], [636, 188, 30], [690, 290, 14], [700, 312, 10], [702, 420, 16]],
    glass: [[312, 298, 8], [380, 210, 14], [630, 202, 16], [676, 296, 8]],
    bottomY: 424, wheels: [225, 578], wheelR: 66, pillarX: 480, headlight: [108, 334], taillight: [690, 306],
  },
  coupe: {
    profile: [[88, 436, 18], [92, 388, 30], [180, 358, 48], [318, 346, 20], [424, 262, 46], [522, 258, 60], [660, 334, 30], [708, 340, 12], [712, 436, 16]],
    glass: [[336, 342, 8], [430, 274, 18], [518, 270, 30], [628, 336, 8]],
    bottomY: 442, wheels: [212, 590], wheelR: 58, pillarX: 520, headlight: [96, 376], taillight: [698, 348],
  },
  convertible: {
    profile: [[88, 436, 18], [92, 388, 30], [180, 358, 48], [318, 346, 14], [372, 286, 6], [384, 290, 6], [340, 350, 10], [660, 344, 20], [708, 344, 12], [712, 436, 16]],
    glass: [[330, 344, 4], [372, 292, 4], [380, 296, 4], [342, 346, 4]],
    bottomY: 442, wheels: [212, 590], wheelR: 58, pillarX: 470, headlight: [96, 376], taillight: [698, 352], convertible: true,
  },
  mpv: {
    profile: [[110, 428, 18], [114, 360, 30], [176, 330, 36], [254, 316, 18], [350, 200, 40], [646, 194, 30], [684, 298, 14], [690, 320, 10], [692, 428, 16]],
    glass: [[270, 312, 8], [356, 214, 16], [640, 208, 16], [672, 304, 8]],
    bottomY: 434, wheels: [225, 578], wheelR: 60, pillarX: 470, headlight: [120, 346], taillight: [682, 312],
  },
  pickup: {
    profile: [[80, 420, 18], [84, 348, 26], [160, 312, 34], [282, 300, 16], [346, 198, 30], [468, 194, 18], [480, 296, 8], [714, 296, 10], [718, 420, 14]],
    glass: [[296, 296, 8], [352, 210, 12], [460, 208, 10], [468, 296, 6]],
    bottomY: 424, wheels: [212, 600], wheelR: 66, pillarX: 410, headlight: [90, 330], taillight: [708, 310],
  },
};

export function roundedPath(points: P[], close: boolean): string {
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const [x, y, r = 0] = points[i]!;
    const prev = points[(i - 1 + n) % n]!;
    const next = points[(i + 1) % n]!;
    const isEnd = !close && (i === 0 || i === n - 1);
    if (isEnd || r === 0) {
      d += `${i === 0 ? "M" : "L"}${x},${y} `;
      continue;
    }
    const v1 = [prev[0] - x, prev[1] - y], v2 = [next[0] - x, next[1] - y];
    const l1 = Math.hypot(v1[0]!, v1[1]!), l2 = Math.hypot(v2[0]!, v2[1]!);
    const c = Math.min(r, l1 / 2, l2 / 2);
    const a = [x + (v1[0]! / l1) * c, y + (v1[1]! / l1) * c];
    const b = [x + (v2[0]! / l2) * c, y + (v2[1]! / l2) * c];
    d += `${i === 0 ? "M" : "L"}${a[0]!.toFixed(1)},${a[1]!.toFixed(1)} Q${x},${y} ${b[0]!.toFixed(1)},${b[1]!.toFixed(1)} `;
  }
  return d + (close ? "Z" : "");
}

export function bodyPath(s: Shape): string {
  const upper = roundedPath(s.profile, false);
  const [fx, rx] = s.wheels;
  const cy = G - s.wheelR;
  const R = s.wheelR + 12;
  const dy = s.bottomY - cy;
  const half = Math.sqrt(Math.max(R * R - dy * dy, 0));
  // along the bottom from rear to front, cutting wheel arches
  return `${upper} L${(rx + half).toFixed(1)},${s.bottomY} A${R},${R} 0 1 0 ${(rx - half).toFixed(1)},${s.bottomY} ` +
    `L${(fx + half).toFixed(1)},${s.bottomY} A${R},${R} 0 1 0 ${(fx - half).toFixed(1)},${s.bottomY} Z`;
}

