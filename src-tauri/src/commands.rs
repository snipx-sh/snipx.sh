use std::process::Command;
use tauri::command;

/// Start the API server as a child process
#[command]
pub async fn start_api() -> Result<String, String> {
    // Check if API is already running by hitting health endpoint
    let client = reqwest::Client::new();
    match client
        .get("http://127.0.0.1:7878/api/v1/health")
        .send()
        .await
    {
        Ok(res) if res.status().is_success() => {
            return Ok("API already running".to_string());
        }
        _ => {}
    }

    // Start bun run api/index.ts as a background process
    Command::new("bun")
        .args(["run", "api/index.ts"])
        .spawn()
        .map_err(|e| format!("Failed to start API: {}", e))?;

    Ok("API started".to_string())
}

/// Check API health
#[command]
pub async fn api_health() -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client
        .get("http://127.0.0.1:7878/api/v1/health")
        .send()
        .await
        .map_err(|e| format!("Health check failed: {}", e))?;

    let body = res
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    Ok(body)
}

/// Copy text to system clipboard
#[command]
pub async fn copy_to_clipboard(text: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Clipboard write failed: {}", e))
}
