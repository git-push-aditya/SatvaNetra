"use client";
import { ReactNode, useContext, createContext, useState } from "react";

interface SharedState {
  page: string;
  setPage: (value: string) => void;
  isAuthenticated : boolean;
  setIsAuthenticated : (value : boolean) => void;
}

const pageContext = createContext<SharedState | undefined>(undefined);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState("Manual");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return (
    <pageContext.Provider value={{ page, setPage,isAuthenticated,setIsAuthenticated }}>
      {children}
    </pageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(pageContext);
  if (!context) throw new Error("usePageContext must be used within PageContextProvider");
  return context;
}
