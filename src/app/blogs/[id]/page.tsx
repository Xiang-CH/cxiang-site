import { getBlog } from "@/lib/notion";
import NotionPageClient from './notion-page-client'

// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css'

// used for code syntax highlighting (optional)
// import 'prismjs/themes/prism.css'
// import 'prismjs/themes/prism-tomorrow.css'

// used for rendering equations (optional)
// import 'katex/dist/katex.min.css'

export default async function Blog({ params }: { params: { id: string } }) {
    const response = await getBlog(params.id)

    // console.log(response)

    if (!response) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <h1>Error</h1>
                <p>😭Something went wrong when retrieving blogs.</p>
            </div>
        )
    } 

    return (
        <main className="w-full h-full flex flex-col justify-start items-center">
            <NotionPageClient
                recordMap={response}
            />
        </main>
    )

}
