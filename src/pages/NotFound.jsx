import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b19] text-white">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">404</h1>
        <p className="mb-6 text-xl text-slate-400">Oops! Hydration route not found</p>
        <a href="/" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors inline-block text-sm font-semibold">
          Return to AquaHome
        </a>
      </div>
    </div>
  );
};

export default NotFound;
