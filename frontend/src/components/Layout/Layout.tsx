// src/components/Layout/Layout.tsx
import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};


export default Layout;