import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserSession(session); // Save user data in state
    } else if (status === "unauthenticated") {
      setUserSession(null);
    }
  }, [session, status]);

  return (
    <AuthContext.Provider value={{ userSession, setUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to AuthContext
export const useAuth = () => useContext(AuthContext);
