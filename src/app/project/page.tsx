import { cacheLife, cacheTag } from "next/cache";
import { getProjects } from "@/lib/notion";
import { type PageObjectResponse } from "@notionhq/client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OpenViewerLink } from "@/components/viewer";
import { GitHubLogoIcon, GlobeIcon } from "@radix-ui/react-icons";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: "Projects",
        socialTitle: "Projects | Chen Xiang",
        description:
            "Selected projects built by Chen Xiang across web, product, and creative development.",
        pathname: "/project",
    }),
};

export default async function Projects() {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.projects);
    let response;
    try {
        response = await getProjects();
    } catch (error) {
        console.error("Error fetching Projects:", error);
        return (
            <>
                <BreadcrumbJsonLd
                    entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Projects" }]}
                />
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <h1>Error</h1>
                    <p>😭Something went wrong when retrieving projects.</p>
                </div>
            </>
        );
    }

    // console.log(response)

    if (!response) {
        return (
            <>
                <BreadcrumbJsonLd
                    entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Projects" }]}
                />
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <h1>Error</h1>
                    <p>😭Something went wrong when retrieving projects.</p>
                </div>
            </>
        );
    } else if (response.results.length === 0) {
        return (
            <>
                <BreadcrumbJsonLd
                    entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Projects" }]}
                />
                <main className="w-full h-screen flex flex-col justify-center items-center">
                    <h1>Project</h1>
                    <p>Coming soon...</p>
                </main>
            </>
        );
    }

    return (
        <>
            <BreadcrumbJsonLd
                entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Projects" }]}
            />
            <main className="w-full max-w-md sm:max-w-3xl lg:max-w-5xl h-full py-6 mx-auto">
                <h1 className="sr-only">Projects</h1>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                    {response.results.map((item) => {
                        if (item.object !== "page" || !("properties" in item)) return;
                        const project = item as PageObjectResponse;
                        const title =
                            project.properties.Title?.type === "title"
                                ? (project.properties.Title.title[0]?.plain_text ?? "Untitled")
                                : "Untitled";

                        const url =
                            project.properties["URL"]?.type === "url" &&
                            project.properties["URL"]?.url;
                        const force_redirects = ["chromewebstore.google.com", "notion.site"];
                        const redirect =
                            url &&
                            force_redirects.some((domain) => {
                                return url.includes(domain);
                            });

                        // console.log(url, redirect);

                        return (
                            <div
                                className="flex flex-col break-inside-avoid mb-6 border rounded-xl pb-2.5 gap-2 bg-neutral-50/40 dark:bg-neutral-900"
                                key={project.id}
                            >
                                {redirect ? (
                                    <Link href={url} target="_blank" className="group">
                                        <ProjectContent project={project} />
                                    </Link>
                                ) : (
                                    <OpenViewerLink viewer={url || ""} className="group">
                                        <ProjectContent project={project} />
                                    </OpenViewerLink>
                                )}

                                <div className="flex px-3.5 gap-1 mt-1">
                                    {project.properties.Repo.type === "url" &&
                                        project.properties.Repo.url && (
                                            <Badge className="py-0.5 px-1.5 rounded-xl">
                                                <Link
                                                    href={project.properties.Repo.url}
                                                    className="flex items-center hover:underline text-xs"
                                                    target="_blank"
                                                >
                                                    <GitHubLogoIcon className="mr-1" width={12} />
                                                    Repo
                                                </Link>
                                            </Badge>
                                        )}

                                    {project.properties["Landing Page"].type === "url" &&
                                        project.properties["Landing Page"].url && (
                                            <Badge className="py-0.5 px-1.5 rounded-xl bg-neutral-600 dark:bg-neutral-700 text-white">
                                                <Link
                                                    href={project.properties["Landing Page"].url}
                                                    className="flex items-center hover:underline text-xs "
                                                    target="_blank"
                                                >
                                                    <GlobeIcon className="mr-1" width={12} />
                                                    Landing Page
                                                </Link>
                                            </Badge>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </>
    );
}

const ProjectContent = ({ project }: { project: PageObjectResponse }) => {
    const title =
        project.properties.Title?.type === "title"
            ? (project.properties.Title.title[0]?.plain_text ?? "Untitled")
            : "Untitled";

    return (
        <>
            {project.cover && (
                <div className="overflow-hidden rounded-t-xl bg-gray-100 dark:bg-neutral-900">
                    <Image
                        src={
                            project.cover?.type === "external"
                                ? project.cover.external.url
                                : project.cover.file.url
                        }
                        alt={`${title} project cover image`}
                        width={
                            project.properties["Cover Width"].type === "rich_text" &&
                            project.properties["Cover Width"].rich_text[0]?.plain_text
                                ? parseInt(
                                      project.properties["Cover Width"].rich_text[0]?.plain_text
                                  )
                                : 307
                        }
                        height={
                            project.properties["Cover Height"].type === "rich_text" &&
                            project.properties["Cover Height"].rich_text[0]?.plain_text
                                ? parseInt(
                                      project.properties["Cover Height"].rich_text[0]?.plain_text
                                  )
                                : 250
                        }
                        quality={40}
                        className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                </div>
            )}
            <div className="flex flex-col gap-1 px-4 pt-2 border-t">
                <h2 className="text-lg sm:text-lg font-[550] group-hover:underline break-words">
                    {title}
                </h2>
                <p className="text-sm font-[350]">
                    {project.properties.Abstract?.type === "rich_text" &&
                        project.properties.Abstract.rich_text[0]?.plain_text}
                </p>
            </div>
        </>
    );
};
