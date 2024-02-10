// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_Tables",
        sql: "
            CREATE TABLE afk (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                created_at datetime default current_timestamp,
                updated_at datetime default current_timestamp
            );
            CREATE TABLE bak (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                created_at datetime default current_timestamp,
                updated_at datetime default current_timestamp,
                afk_id INTEGER NOT NULL,
                FOREIGN KEY(afk_id) REFERENCES afk(id)
            );
            ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        // .setup(|app| {
        //     #[cfg(debug_assertions)] // only include this code on debug builds
        //     {
        //     let window = app.get_window("main").unwrap();
        //     window.open_devtools();
        //     window.close_devtools();
        //     }
        //     Ok(())
        // })
        .plugin(
            tauri_plugin_sql::Builder::default()
                // macos location: ~/Library/Application\ Support/<tauri.bundle.identifier>/<dbname>.db
                .add_migrations("sqlite:afk-track.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
