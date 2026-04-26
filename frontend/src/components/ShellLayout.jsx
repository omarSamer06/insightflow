import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function ShellLayout({ children }) {
  return (
    <div className="min-h-screen text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
