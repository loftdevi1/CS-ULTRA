import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/create-order", label: "New Order", icon: Plus },
  ];

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-charcoal text-white flex flex-col border-r border-border/20" data-testid="sidebar">
        <div className="p-6 border-b border-border/20">
          <h1 className="text-2xl font-serif font-medium text-brand-gold" data-testid="app-title">
            Kashmkari
          </h1>
          <p className="text-xs text-gray-400 tracking-widest mt-1">SUPPORT PORTAL</p>
        </div>

        <nav className="flex-1 p-4" data-testid="sidebar-nav">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors ${
                      isActive
                        ? "bg-brand-gold text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-sans tracking-wide">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6 border-t border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-sm font-semibold">
              KS
            </div>
            <div>
              <p className="text-sm font-medium">Kashmkari Support</p>
              <p className="text-xs text-gray-400">Team Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
