import { createContext, useContext, useState } from "react";

// Create the context
const GlobalValuesContext = createContext();

// Context provider component
export const GlobalValuesProvider = ({ children }) => {
  const [globalValues, setGlobalValue] = useState(null);

  return (
    <GlobalValuesContext.Provider value={{ globalValues, setGlobalValue }}>
      {children}
    </GlobalValuesContext.Provider>
  );
};

// Custom hook to use the context
export const useGlobalValues = () => useContext(GlobalValuesContext);
