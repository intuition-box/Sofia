import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '~/components/Layout'
import { HomePage } from '~/pages/HomePage'
import { ReadingPage } from '~/pages/ReadingPage'
import { ManifestoPage } from '~/pages/ManifestoPage'
import { NotFoundPage } from '~/pages/NotFoundPage'
import '~/styles/global.css'

/* The docs are served at their own subdomain
   (docs.sofia.intuition.box). Routes:

     /                          → HomePage (editorial)
     /docs/<id>                 → ReadingPage (canonical tree|toc)
     /manifesto                 → ManifestoPage (full-bleed)
     /litepaper                 → LitepaperPage (chapter index)
     /architecture              → ArchitecturePage (diagram)
     *                          → 404

   Legacy redirects replay the old Docusaurus
   plugin-client-redirects config 1:1 so external links survive
   the de-Docusaurus migration. */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />

          {/* Special editorial pages */}
          <Route path="/manifesto" element={<ManifestoPage />} />
          <Route
            path="/litepaper"
            element={<Navigate to="/docs/litepaper/introduction" replace />}
          />
          <Route
            path="/architecture"
            element={<ReadingPage docId="architecture/overview" />}
          />

          {/* Special pages aliased under /docs → canonical route */}
          <Route
            path="/docs/manifesto"
            element={<Navigate to="/manifesto" replace />}
          />
          <Route
            path="/docs/architecture/overview"
            element={<Navigate to="/architecture" replace />}
          />

          {/* Legacy Docusaurus redirects (docusaurus.config.ts) */}
          <Route
            path="/docs/introduction"
            element={<Navigate to="/docs/intro" replace />}
          />
          <Route
            path="/about"
            element={<Navigate to="/docs/about" replace />}
          />
          <Route
            path="/values"
            element={<Navigate to="/docs/intro" replace />}
          />

          {/* Canonical reading route — splat carries the doc id */}
          <Route path="/docs/*" element={<ReadingPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
