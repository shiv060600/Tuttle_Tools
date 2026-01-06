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

  return (
    <aside 
      className={`
        bg-white border-r border-gray-200 flex flex-col
        transition-all duration-500 ease-in-out
        ${open ? 'w-[30%] opacity-100' : 'w-0 opacity-0 overflow-hidden'}
      `}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="hover:bg-gray-600 rounded-lg "
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
