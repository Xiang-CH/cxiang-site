export default function TocWheel({
  currentSection,
  Sections,
  onSectionClick,
}: {
  currentSection: string;
  Sections: { href: string; label: string }[];
  onSectionClick: (section: string) => void;
}) {
  return (
    <aside className="w-[50%] hidden md:flex flex-col justify-center items-start gap-2 md:gap-4 md:pl-[5%] lg:pl-[13%] sticky top-0 h-screen transition-all">
      {Sections.map((section) => {
        return (
          <div
            key={section.href}
            className="flex items-center cursor-pointer"
            onClick={() => onSectionClick(section.href)}
          >
            {section.href === currentSection ? (
              <>
                <div className="w-20 h-2 bg-primary/80 transition-all duration-300 ease-in-out my-1" />
                <div className="mx-4 font-bold text-3xl text-primary/80 transition-all duration-300 ease-in-out">
                  {section.label}
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-2 bg-neutral-300 dark:bg-gray-600 transition-all duration-300 ease-in-out" />
                <div className="mx-4 text-md text-neutral-300 dark:text-gray-600 transition-all duration-300 ease-in-out">
                  {section.label}
                </div>
              </>
            )}
          </div>
        );
      })}
    </aside>
  );
}
