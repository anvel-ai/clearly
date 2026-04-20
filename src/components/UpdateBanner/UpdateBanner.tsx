import { useUpdater } from "../../hooks/useUpdater";
import "./UpdateBanner.css";

export default function UpdateBanner() {
  const { status, installUpdate } = useUpdater();

  if (status.kind === "idle" || status.kind === "checking") return null;

  if (status.kind === "available") {
    const { version } = status.update;
    return (
      <div className="update-banner">
        <span className="update-banner-text">
          A new version <strong>v{version}</strong> is available.
        </span>
        <button className="update-banner-btn" onClick={installUpdate}>
          Install now
        </button>
      </div>
    );
  }

  if (status.kind === "downloading") {
    const pct = Math.round(status.progress * 100);
    return (
      <div className="update-banner">
        <span className="update-banner-text">Downloading update… {pct}%</span>
      </div>
    );
  }

  if (status.kind === "ready") {
    return (
      <div className="update-banner">
        <span className="update-banner-text">Install complete. Restarting…</span>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="update-banner update-banner-error">
        <span className="update-banner-text">
          Update check failed: {status.message}
        </span>
      </div>
    );
  }

  return null;
}
