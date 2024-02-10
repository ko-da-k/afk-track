import { useEffect, useRef, useState } from "react";
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import Database from "tauri-plugin-sql-api";
import "./App.css";
import { updateStatus, updatePresence } from "./slack";

// sqlite. The path is relative to `tauri::api::path::BaseDirectory::App`.
const db = await Database.load("sqlite:afk-track.db");

// Away from Keyboard
type Afk = {
  id: number,
  from: Date,
  to?: Date,
}

const diffMin = (afk: Afk): number | undefined => {
  if (!afk.to) {
    return undefined
  }
  return Math.floor((afk.to.getTime() - afk.from.getTime()) / (1000 * 60))
}

const totalMin = (afks: Afk[]): number => {
  return afks.reduce((total, afk) => {
    const minutes = diffMin(afk) || 0; // undefinedの場合は0で埋める
    return total + minutes;
  }, 0);
}

const ymdStr = (offsetDay: number = 0) : string => {
    const now = new Date(Date.now());
    now.setDate(now.getDate() + offsetDay)
    const yyyy = now.getFullYear();
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [isAfk, setIsAfk] = useState<boolean>(false);
  const [afks, setAfks] = useState<Afk[]>([]);
  const currentId = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      return;
    }
    (async () => {
      const res = await currentAfks();
      setAfks(res);
      currentId.current = (Math.max(...res.map(item => item.id)));
    })();
    setLoading(true);
  }, [loading]);

  useEffect(() => {
    (async () => {
      await unregisterAll();
      await register('CommandOrControl+Shift+C', async () => {
        if (isAfk) {
          await bak();
        } else {
          await afk();
        };
      });
      const res = await currentAfks();
      setAfks(res);
      currentId.current = (Math.max(...res.map(item => item.id)));
    })();
  }, [isAfk])

  const currentAfks = async () => {
    type Table = {
      id: number,
      afk_at: string,
      bak_at?: string,
    }
    const data: Table[] = await db.select(`
      SELECT 
        a.id, 
        datetime(a.created_at, 'localtime') as afk_at, 
        datetime(b.created_at, 'localtime') as bak_at
      FROM afk as a
      LEFT JOIN bak as b
      ON a.id = b.afk_id
      WHERE datetime(a.created_at, 'localtime') between '${ymdStr()}' and '${ymdStr(1)}'
    `);
    const res = data.map((item) => ({
      id: item.id,
      from: new Date(item.afk_at),
      to: item.bak_at ? new Date(item.bak_at) : undefined,
    }));
    return res;
  }
  
  // away from keyboard
  const afk = async () => {
    await db.execute("INSERT into afk DEFAULT VALUES");
    setIsAfk((current) => !current);
    updateStatus(true);
    updatePresence(true);
  };

  // back at keyboard
  const bak = async () => {
    await db.execute( "INSERT into bak (afk_id) VALUES ($1)", [currentId.current]);
    setIsAfk((current) => !current);
    updateStatus(false);
    updatePresence(false);
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-4 h-20">
        <div className="flex items-center justify-end">
          <button className="btn btn-circle">{`<`}</button>
        </div>
        <div className="col-span-2 flex items-center justify-center">
          {ymdStr()}
        </div>
        <div className="flex items-center justify-start">
          <button className="btn btn-circle">{`>`}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 h-20">
        <div className="flex items-center justify-center">
          <span className={`badge-lg ${isAfk ? 'bg-primary' : 'bg-secondary'}`}>{isAfk ? "離席中" : "在席中"}</span>
        </div>
        <div className="flex items-center justify-center">
          <p>totalMin: {totalMin(afks)}</p>
        </div>
      </div>
      <table className="table items-center justify-center">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Minutes</th>
          </tr>
        </thead>
        <tbody>
          {afks.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.from.toLocaleString()}</td>
              <td>{item.to?.toLocaleString()}</td>
              <td>{diffMin(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
