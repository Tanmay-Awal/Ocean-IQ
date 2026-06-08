import { Sidebar } from "./Sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] w-full mx-auto px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
