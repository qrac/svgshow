import { useState, useRef, useCallback } from "react"
import { FiDownload } from "react-icons/fi"
import { SiGithub } from "react-icons/si"
import DOMPurify from "dompurify"

import "./app.css"
import Logo from "./logo.svg?react"
import { version, repository } from "../package.json"

type SpriteFile = {
  fileName: string
  items: SpriteItem[]
}

type SpriteItem = {
  id: string
  viewBox: string
  paths: string
}

DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (!data.attrName.match(/^on\w+/)) {
    data.forceKeepAttr = true
  }
})

export default function App() {
  const [spriteFiles, setSpriteFiles] = useState<SpriteFile[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const attachRef = useRef<HTMLInputElement>(null)

  function refReset() {
    if (attachRef.current) attachRef.current.value = ""
  }

  function parseSvgSprite(value: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(value, "image/svg+xml")
    const symbols = Array.from(doc.querySelectorAll("symbol"))

    let spriteItems: SpriteItem[] = symbols.map((symbol) => {
      const id = symbol.getAttribute("id") || ""
      const viewBox = symbol.getAttribute("viewBox") || ""
      const paths = symbol.innerHTML || ""
      return { id, viewBox, paths }
    })
    spriteItems = spriteItems.filter((item) => {
      if (item.id && item.viewBox && item.paths) return item
    })
    return spriteItems
  }

  function readSvgSprite(e: ProgressEvent<FileReader>, fileName: string) {
    if (!e.target) return
    if (typeof e.target.result === "string") {
      const html = DOMPurify.sanitize(e.target.result)
      const items = parseSvgSprite(html)
      const spriteFile: SpriteFile = { fileName, items }
      setSpriteFiles((current) => [...current, spriteFile])
    }
  }

  function readSvgFiles(svgFiles: File[]) {
    if (!svgFiles.length) return
    for (let i = 0; i < svgFiles.length; i++) {
      const reader = new FileReader()
      reader.onloadend = (e) => readSvgSprite(e, svgFiles[i].name)
      reader.readAsText(svgFiles[i])
    }
  }

  function handleRemove(index: number) {
    const items = [...spriteFiles]
    items.splice(index, 1)
    setSpriteFiles(items)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return refReset()
    const files = Array.from(e.target.files)
    const svgFiles = files.filter((file) => file.name.endsWith(".svg"))
    readSvgFiles(svgFiles)
    refReset()
  }

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.items)
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
    const svgFiles = files.filter((file) => file.name.endsWith(".svg"))
    readSvgFiles(svgFiles)
    setIsDraggingOver(false)
  }, [])
  return (
    <div className="app">
      <header className="box is-flex is-middle is-between is-nowrap is-gap-sm">
        <div className="box is-flex is-middle is-nowrap is-gap-xs">
          <h1>
            <Logo className="logo" title="svgshow" />
          </h1>
          <span className="box is-outline is-px-xxs is-radius-xs">
            <div className="text is-mono is-xs">v{version}</div>
          </span>
          <h2 className="text is-mono is-xs is-flex-0">SVG Sprite Viewer</h2>
        </div>
        <div className="box">
          <a className="button is-melt is-circle is-sm" href={repository.url}>
            <SiGithub className="icon is-xl" />
          </a>
        </div>
      </header>
      <main className="main">
        {spriteFiles.map((spriteFile, spriteFileIndex) => (
          <article className="sprite is-space-md" key={spriteFileIndex}>
            <header className="box is-flex is-middle is-between is-gap-sm is-pb-xs is-outline-bottom">
              <div className="box">
                <h2 className="text is-mono is-lg">{spriteFile.fileName}</h2>
              </div>
              <div className="box">
                <button
                  type="button"
                  onClick={() => handleRemove(spriteFileIndex)}
                  className="button is-outline is-round is-xs"
                >
                  表示を解除
                </button>
              </div>
            </header>
            <ul className="sprite-items">
              {spriteFile.items.map((item, index) => (
                <li
                  className="box is-p-lg is-outline is-radius-sm is-space-sm"
                  key={index}
                >
                  <div className="box">
                    <svg
                      className="sprite-svg"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      viewBox={item.viewBox}
                      dangerouslySetInnerHTML={{ __html: item.paths }}
                    />
                  </div>
                  <p className="text is-mono is-center is-line-height-xs is-xs">
                    {item.id}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </main>
      <aside className="aside">
        <div
          className={isDraggingOver ? "selection is-over" : "selection"}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="box is-space-sm">
            <p className="text is-center">ファイルをドラッグアンドドロップ</p>
            <div className="box is-flex is-center">
              <input
                className="button is-outline"
                type="button"
                value="ファイルを選択"
                onClick={() => attachRef.current?.click()}
              />
              <input
                type="file"
                style={{ display: "none" }}
                ref={attachRef}
                multiple
                onChange={handleInput}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
