import { X, Home, Database } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SideNavProps {
  open: boolean;
  setOpen: (state: boolean) => void;
}

export default function SideNav({ open, setOpen }: SideNavProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/customer-mapping', label: 'Customer Mapping', icon: Database },
  ];

  if (!open) return null;

  return (
    <aside 
      className="bg-white border-r border-gray-200 flex flex-col w-64 transition-all duration-300 ease-in-out"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }
              `}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
