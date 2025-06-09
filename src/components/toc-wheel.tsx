export default function TocWheel({currentSection, Sections}: {currentSection: string, Sections: string[]}) {
    return (
        <aside className="w-[50%] flex flex-col justify-center items-start gap-4 px-[10%]">
            {Sections.map((section) => {
                return (
                    <div key={section} className="flex items-center">
                        {section === currentSection ? (
                            <>
                                <div className="w-20 h-3 bg-primary/80 transition-all duration-300 ease-in-out"/>
                                <div className="mx-4 font-bold text-3xl text-primary/80 transition-all duration-300 ease-in-out">{section}</div>
                            </>

                        ) : (
                            <>
                                <div className="w-12 h-3 bg-neutral-300 dark:bg-gray-600 transition-all duration-300 ease-in-out"/>
                                <div className="mx-4 text-md text-neutral-300 dark:text-gray-600 transition-all duration-300 ease-in-out">{section}</div>
                            </>
                        )}
                    </div>
                )
            })}
        </aside>
    )
}