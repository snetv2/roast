type Props = {
  muted?: boolean;
};

export function SnetWordmark({ muted = false }: Props) {
  return (
    <span className={`snet-wordmark ${muted ? "snet-wordmark--muted" : ""}`}>
      S NET
    </span>
  );
}
