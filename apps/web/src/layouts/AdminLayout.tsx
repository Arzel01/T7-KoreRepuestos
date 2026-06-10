import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AdminLayout(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950 text-ink-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-ink-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
