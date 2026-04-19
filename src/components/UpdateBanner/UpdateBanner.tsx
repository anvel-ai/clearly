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
          새 버전 <strong>v{version}</strong>이(가) 있어요.
        </span>
        <button className="update-banner-btn" onClick={installUpdate}>
          지금 설치
        </button>
      </div>
    );
  }

  if (status.kind === "downloading") {
    const pct = Math.round(status.progress * 100);
    return (
      <div className="update-banner">
        <span className="update-banner-text">업데이트 다운로드 중… {pct}%</span>
      </div>
    );
  }

  if (status.kind === "ready") {
    return (
      <div className="update-banner">
        <span className="update-banner-text">설치 완료. 앱을 재시작할게요…</span>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="update-banner update-banner-error">
        <span className="update-banner-text">
          업데이트 확인 실패: {status.message}
        </span>
      </div>
    );
  }

  return null;
}
