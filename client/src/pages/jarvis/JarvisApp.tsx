import AuthGuard from "@/components/AuthGuard";
import ChatInterface from "./ChatInterface";

export default function JarvisApp() {
  return (
    <AuthGuard
      application="jarvis"
      title="J.A.R.V.I.S"
      description="Just A Rather Very Intelligent System"
      icon="fas fa-robot"
      theme="jarvis"
    >
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ChatInterface />
      </div>
    </AuthGuard>
  );
}
