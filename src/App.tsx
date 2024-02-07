import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import Database from "tauri-plugin-sql-api";
import "./App.css";

// sqlite. The path is relative to `tauri::api::path::BaseDirectory::App`.
const db = await Database.load("sqlite:afk-track.db");

type AfkTable = {
  id: number,
  created_at: string,
  updated_at: string,
}

// Away from Keyboard
type Afk = {
  id: number,
  createdAt: Date,
  updatedAt: Date,
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [afks, setAfks] = useState<Afk[]>([]);

  useEffect(() => {
    // global shortcut
    (async () => {
      await unregisterAll();
      await register('CommandOrControl+Shift+C', async () => {
        console.log('Shortcut triggered');
        await greet();
      });
    })();
  }, []);

  async function greet() {
    await db.execute( "INSERT into afk DEFAULT VALUES");
    console.log("insert row");
    const res: AfkTable[] = await db.select(`
      SELECT 
        id, 
        datetime(created_at, 'localtime') as created_at, 
        datetime(updated_at, 'localtime') as updated_at
      FROM afk
    `);
    console.log(res)
    setAfks(res.map((item) => ({
      id: item.id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    })));
    console.log(afks);
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>CreatedAt</th>
            <th>UpdatedAt</th>
          </tr>
        </thead>
        <tbody>
          {afks.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.createdAt.toLocaleString()}</td>
              <td>{item.updatedAt.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
