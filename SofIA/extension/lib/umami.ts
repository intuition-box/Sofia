import { useLocation } from "react-router-dom"

export async function umami(eventName?: string, data?: any, url?: string) {
    const origin = process.env.PLASMO_PUBLIC_UMAMI_ORIGIN!
    const websiteId = process.env.PLASMO_PUBLIC_UMAMI_WEBSITE_ID!
    const apiKey = process.env.PLASMO_PUBLIC_UMAMI_API_KEY

    if (!origin || !websiteId) {
        console.error("Umami origin or website ID missing")
        return
    }

    const response = await fetch("https://api.ipify.org?format=json")
    const apifyResponse = await response.json()

    const body = {
        payload: {
            hostname: window.location.hostname,
            language: navigator.language,
            referrer: document.referrer,
            screen: `${window.screen.width}x${window.screen.height}`,
            title: document.title,
            url: url || window.location.pathname,
            website: websiteId,
            name: eventName,
            ip: apifyResponse.ip,
            version: chrome.runtime.getManifest().version,
            data
        },
        type: "event"
    }

    console.log(`[Umami] Sending to ${origin}/api/send`, body)

    try {
        const res = await fetch(`${origin}/api/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            console.error("[Umami] Error", res.status, await res.text())
        } else {
            console.log("[Umami] Success", res.status)
        }
    } catch (e) {
        console.error("[Umami] Fetch failed:", e)
    }
}