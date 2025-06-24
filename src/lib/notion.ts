"use server";
import { Client } from "@notionhq/client";
import { NotionAPI } from "notion-client";

if (!process.env.NOTION_SECRET) {
    throw new Error("NOTION_SECRET environment variable is not set");
}

const notion = new Client({
    auth: process.env.NOTION_SECRET,
});

const api = new NotionAPI({
    authToken: process.env.NOTION_SECRET,
});

export const getBlogs = async () => {
    // if (process.env.NODE_ENV === 'production') {
    //     // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    //     'use cache'
    // }
    return notion.databases.query({
        database_id: process.env.NOTION_BLOG_DATABASE_ID!,
        filter: {
            or: [
                {
                    property: "Live",
                    checkbox: {
                        equals: true,
                    },
                },
            ],
        },
        sorts: [
            {
                property: "Publish Date",
                direction: "descending",
            },
        ],
    });
};

export const getBlogMetadata = async (id: string) => {
    if (!id) {
        throw new Error("Blog ID is required");
    }

    return notion.pages.retrieve({
        page_id: id,
    });
};

export const getBlog = async (id: string) => {
    if (!id) {
        throw new Error("Blog ID is required");
    }

    // if (process.env.NODE_ENV === 'production') {
    //     // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    //     'use cache'
    // }

    return api.getPage(id);
};
