// Plasmo content-script ENTRY for the Add-to-Sofia modal. Plasmo only injects
// content scripts discovered in contents/, so this file must live here — but
// it's just a thin shell: the modal itself lives in
// components/modals/addToSofia/AddToSofiaModal.tsx.
import styleText from "data-text:~contents/addToSofia.css"
import type { PlasmoCSConfig } from "plasmo"

import AddToSofiaModal from "~components/modals/addToSofia/AddToSofiaModal"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

export default AddToSofiaModal
