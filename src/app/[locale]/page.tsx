import Intro from "./_components/intro";
import ScrollArrow from "@/components/scroll-arrow";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col">
        <Intro />

        <ScrollArrow/>
      </main>
      
      <footer className="">
        
      </footer>
    </div>
  );
}
