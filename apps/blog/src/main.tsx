import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BlogIndex } from './pages/BlogIndex'
import { BlogPost } from './pages/BlogPost'
import { AuthorPage } from './pages/AuthorPage'
import { TagPage } from './pages/TagPage'
import { NotFound } from './pages/NotFound'
import './styles/global.css'

/* The blog is served at its own subdomain (blog.sofia.intuition.box).
   Routes use a flat scheme matching the old Docusaurus blog layout:
     /                          → BlogIndex
     /:slug                     → BlogPost
     /authors/:idOrPermalink    → AuthorPage
     /tags/:idOrPermalink       → TagPage
   The leading `/blog` segment that Docusaurus used is dropped here
   since the subdomain already namespaces the site. */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<BlogIndex />} />
          <Route path="/authors/:id" element={<AuthorPage />} />
          <Route path="/tags/:id" element={<TagPage />} />
          <Route path="/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
