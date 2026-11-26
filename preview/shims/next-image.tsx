/** Preview shim for next/image: plain <img>, relative paths, `fill` → absolute cover. */
export default function Image({ src, alt, fill, width, height, sizes: _s, priority, className, style }: {
  src: string; alt: string; fill?: boolean; width?: number; height?: number; sizes?: string; priority?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const url = src.startsWith("/") ? src.slice(1) : src;
  return (
    <img src={url} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} loading={priority ? "eager" : "lazy"} decoding="async"
      className={className} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style} />
  );
}
