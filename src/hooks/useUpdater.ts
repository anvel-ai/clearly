import { useCallback, useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; update: Update }
  | { kind: "downloading"; progress: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function useUpdater() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const checkForUpdate = useCallback(async (silent = true) => {
    setStatus({ kind: "checking" });
    try {
      const update = await check();
      if (update) {
        setStatus({ kind: "available", update });
      } else {
        setStatus({ kind: "idle" });
      }
    } catch (err) {
      if (silent) {
        setStatus({ kind: "idle" });
        console.warn("Update check failed:", err);
      } else {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (status.kind !== "available") return;
    const update = status.update;
    let downloaded = 0;
    let contentLength = 0;
    setStatus({ kind: "downloading", progress: 0 });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          const progress = contentLength > 0 ? downloaded / contentLength : 0;
          setStatus({ kind: "downloading", progress });
        } else if (event.event === "Finished") {
          setStatus({ kind: "ready" });
        }
      });
      await relaunch();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  return { status, checkForUpdate, installUpdate };
}
