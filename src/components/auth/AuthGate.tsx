'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../providers/SupabaseProvider";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return <p className="muted">Checking your session...</p>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}



