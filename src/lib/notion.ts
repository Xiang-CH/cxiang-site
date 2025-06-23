"use server"
import { Client } from "@notionhq/client";
import { NotionAPI } from 'notion-client'

const notion = new Client({
  auth: process.env.NOTION_SECRET,
})

const api = new NotionAPI({
    authToken: process.env.NOTION_SECRET,
})


export const getBlogs = async () => {
    if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        'use cache'
    }
    return notion.databases.query({
        database_id: process.env.NOTION_BLOG_DATABASE_ID!,
        filter: {
            or: [
                {
                    property: "Live",
                    checkbox: {
                        equals: true,
                    }
                }
            ]
        },
        sorts: [
            {
                property: "Publish Date",
                direction: "descending",
            }
        ]
    })
}

export const getBlog = async (id: string) => {
    if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        'use cache'
    }
    // return notion.pages.retrieve({
    //     page_id: id,
    // })
    return api.getPage(id)
}