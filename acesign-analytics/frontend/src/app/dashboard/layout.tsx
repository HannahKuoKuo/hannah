import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
