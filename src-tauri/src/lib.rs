#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());

    let builder = builder.setup(|_app| {
        // On Windows / Linux, drop the native title bar so the app's custom
        // one (hamburger / filename / theme toggle) isn't stacked underneath
        // a default OS chrome. macOS keeps its native decorations so the
        // traffic-light buttons remain available via titleBarStyle: Overlay.
        #[cfg(any(target_os = "windows", target_os = "linux"))]
        {
            use tauri::Manager;
            if let Some(window) = _app.get_webview_window("main") {
                let _ = window.set_decorations(false);
            }
        }
        Ok(())
    });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
