import ChatwootWidget from "@/components/ChatwootWidget";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatwootWidget />
    </>
  );
}
