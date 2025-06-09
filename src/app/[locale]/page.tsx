import MainContent from "./_components/main-content";
import Intro from "./_components/intro";
import ScrollArrow from "@/components/scroll-arrow";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <main className="snap-mandatory snap-y h-screen overflow-y-scroll scroll-smooth">
        <Intro />
        <MainContent />
        <ScrollArrow/>
      </main>
      <footer className="">
        
      </footer>
    </div>
  );
}
