import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || isGuest)) {
      navigate("/products");
    }
  }, [user, loading, isGuest, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FunnyLoadingText />
      </div>
    );
  }

  if (!user || isGuest) {
    return null;
  }

  return <>{children}</>;
}
