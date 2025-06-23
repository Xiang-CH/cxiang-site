import posthog from 'posthog-js'

// console.log(window.location.origin)${window.location.origin}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: `${window.location.origin}/relay-5woc`,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: true
});