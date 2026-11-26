/**
 * Generates ILLUSTRATIVE studio-style vehicle renders (SVG) for demo listings.
 * Real listings use uploaded photography via Supabase Storage + next/image.
 * Every render carries an "Illustrative image" watermark so it can never be
 * mistaken for a photo of a genuine vehicle.
 */
import type { BodyType } from "../src/types/vehicle";
import { bodyPath, G, roundedPath, shapes, type Shape } from "../src/lib/art/body-shapes";

const paint: Record<string, [string, string, string]> = {
  black: ["#3a3f48", "#15181d", "#0a0c0f"],
  white: ["#ffffff", "#e9edf2", "#c4cad3"],
  silver: ["#e6e9ee", "#b4bac4", "#7d8591"],
  grey: ["#8b929c", "#5c636d", "#363b42"],
  blue: ["#4f8ff7", "#1d4fbf", "#0d2a6e"],
  red: ["#f0565a", "#b8191e", "#6d0b0e"],
  green: ["#4d9a72", "#24603f", "#113322"],
  orange: ["#ffa152", "#e06512", "#8a3a05"],
  yellow: ["#ffe27a", "#e6b414", "#8f6c00"],
  bronze: ["#c79a6b", "#8c6239", "#4f361d"],
};



function wheelWell(s: Shape, cx: number): string {
  const cy = G - s.wheelR, R = s.wheelR + 12, dy = s.bottomY - cy;
  const half = Math.sqrt(Math.max(R * R - dy * dy, 0));
  return `<path d="M${(cx + half).toFixed(1)},${s.bottomY} A${R},${R} 0 1 0 ${(cx - half).toFixed(1)},${s.bottomY} Z" fill="#0d1014"/>`;
}

function wheel(cx: number, r: number, id: string): string {
  const cy = G - r;
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 * Math.PI) / 180;
    const x = cx + Math.cos(a) * r * 0.56, y = cy + Math.sin(a) * r * 0.56;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="url(#rim${id})" stroke-width="${(r * 0.17).toFixed(1)}" stroke-linecap="round"/>`;
  }).join("");
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#16191e"/><circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="#2a2e35"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="url(#rim${id})" stroke-width="3"/>${spokes}` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.12}" fill="#c9ced6"/></g>`;
}

export type ArtVariant = 0 | 1 | 2 | 3;

const backdrops: [string, string][] = [
  ["#f4f6f9", "#dfe4ea"],
  ["#eef2f8", "#d4dbe6"],
  ["#f6f5f3", "#e2dfda"],
  ["#eef1f4", "#cfd6de"],
];

/** variant 0: side; 1: mirrored side; 2: front detail; 3: rear detail */
export function renderVehicleSvg(body: BodyType, colour: string, variant: ArtVariant, label: string, opts: { transparent?: boolean } = {}): string {
  const s = shapes[body];
  const [hi, mid, lo] = paint[colour.toLowerCase()] ?? paint.silver!;
  const id = `${body}${colour}${variant}`.replace(/\W/g, "");
  const [b1, b2] = backdrops[variant]!;
  const viewBox = variant === 2 ? "40 150 460 345" : variant === 3 ? "330 150 460 345" : "0 0 800 600";
  const flip = variant === 1 ? `transform="translate(800,0) scale(-1,1)"` : "";
  const beltY = Math.max(...s.glass.map((g) => g[1]));
  const glassTop = Math.min(...s.glass.map((g) => g[1]));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="1200" height="900" role="img" aria-label="${label} (illustrative render)">
<defs>
<radialGradient id="bg${id}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></radialGradient>
<linearGradient id="paint${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
<linearGradient id="glass${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d4b5e"/><stop offset=".55" stop-color="#18202b"/><stop offset="1" stop-color="#0c1118"/></linearGradient>
<linearGradient id="rim${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f5"/><stop offset="1" stop-color="#8a929d"/></linearGradient>
<radialGradient id="shadow${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
${opts.transparent ? "" : `<rect x="-50" y="-50" width="900" height="700" fill="url(#bg${id})"/>\n<rect x="-50" y="${G}" width="900" height="200" fill="${b2}" opacity=".6"/>`}
<g ${flip}>
<ellipse cx="400" cy="${G + 4}" rx="340" ry="22" fill="url(#shadow${id})"/>
<path d="${bodyPath(s)}" fill="url(#paint${id})" stroke="${lo}" stroke-width="1.5"/>
<path d="${roundedPath(s.glass, true)}" fill="url(#glass${id})"/>
${s.convertible ? `<rect x="420" y="${beltY - 34}" width="26" height="36" rx="10" fill="#1b1f25"/><rect x="520" y="${beltY - 30}" width="24" height="32" rx="10" fill="#1b1f25"/>` :
  `<line x1="${s.pillarX}" y1="${glassTop + 6}" x2="${s.pillarX}" y2="${beltY + 2}" stroke="${lo}" stroke-width="9"/>`}
<path d="M${s.glass[0]![0] - 6},${beltY + 8} L${s.glass[s.glass.length - 1]![0] + 8},${beltY + 8}" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/>
<line x1="${s.pillarX}" y1="${beltY + 6}" x2="${s.pillarX + 6}" y2="${s.bottomY - 16}" stroke="${lo}" stroke-opacity=".55" stroke-width="1.6"/>
<rect x="${s.pillarX - 70}" y="${beltY + 26}" width="26" height="6" rx="3" fill="${lo}" opacity=".6"/>
<rect x="${s.pillarX + 40}" y="${beltY + 26}" width="26" height="6" rx="3" fill="${lo}" opacity=".6"/>
<path d="M${s.headlight[0]},${s.headlight[1]} q18,-14 52,-10 l-6,12 q-30,4 -46,6z" fill="#eaf3ff" stroke="#9fb3c8" stroke-width="1"/>
<rect x="${s.taillight[0] - 22}" y="${s.taillight[1] - 6}" width="26" height="14" rx="5" fill="#d0202a"/>
<path d="M${s.profile[1]![0] + 4},${s.bottomY - 30} h60" stroke="#0e1115" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
${wheelWell(s, s.wheels[0])}${wheelWell(s, s.wheels[1])}${wheel(s.wheels[0], s.wheelR, id)}${wheel(s.wheels[1], s.wheelR, id)}
</g>
<g font-family="Inter, Arial, sans-serif" font-size="13" font-weight="600" fill="${opts.transparent ? "#9aa6bd" : "#5b6472"}" letter-spacing=".08em">
<text x="${variant === 3 ? 772 : variant === 2 ? 484 : 784}" y="${variant >= 2 ? 482 : 586}" text-anchor="end" opacity=".75">ILLUSTRATIVE IMAGE · DEMO LISTING</text>
</g>
</svg>`;
}
