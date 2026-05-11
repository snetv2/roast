const VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const SHA = (import.meta.env.VITE_APP_SHA ?? "").slice(0, 7);

export function VersionTag() {
  return (
    <div className="version-tag" aria-label="build version">
      <span>v{VERSION}</span>
      {SHA && (
        <>
          <span aria-hidden="true">·</span>
          <code>{SHA}</code>
        </>
      )}
    </div>
  );
}
