import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AdminLayout(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-navy-50">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-navy-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
