import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, BarChart3, Trash2, Menu, X } from "lucide-react";
import { useState } from "react";

export const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/create-order", label: "New Order", icon: Plus },
    { path: "/manage-orders", label: "Manage Orders", icon: Trash2 },
  ];

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-brand-charcoal text-white rounded-md shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-brand-charcoal text-white flex flex-col border-r border-border/20 transition-transform duration-300`}
        data-testid="sidebar"
      >
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
                    onClick={() => setIsMobileMenuOpen(false)}
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

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-0 pb-20 lg:pb-0 lg:ml-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
