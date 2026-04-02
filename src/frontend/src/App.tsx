import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import MainApp from "./components/MainApp";
import PasscodeScreen from "./components/PasscodeScreen";

const queryClient = new QueryClient();

export default function App() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("unlocked") === "true";
  });

  const handleUnlock = () => {
    sessionStorage.setItem("unlocked", "true");
    setUnlocked(true);
  };

  if (!unlocked) {
    return <PasscodeScreen onUnlock={handleUnlock} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
