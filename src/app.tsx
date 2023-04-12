import { useState, useRef, useCallback } from "react"
import DOMPurify from "dompurify"

import "./app.css"
import { ReactComponent as Logo } from "./logo.svg"
import { ReactComponent as GithubLogo } from "./github.svg"
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
      <header className="app-header">
        <div className="block-titles">
          <h1 className="block-title">
            <Logo className="block-title-logo" title="svgshow" />
          </h1>
          <span className="block-version">v{version}</span>
          <h2 className="block-subtitle">SVG Sprite Viewer</h2>
          <a className="block-link-icon" href={repository.url}>
            <GithubLogo className="block-github" />
          </a>
        </div>
      </header>
      <main className="app-main">
        {spriteFiles.map((spriteFile, spriteFileIndex) => (
          <article className="block-sprite" key={spriteFileIndex}>
            <header className="block-sprite-header">
              <h2 className="block-sprite-title">{spriteFile.fileName}</h2>
              <button
                type="button"
                onClick={() => handleRemove(spriteFileIndex)}
                className="block-sprite-clear"
              >
                表示を解除
              </button>
            </header>
            <ul className="block-sprite-items">
              {spriteFile.items.map((item, index) => (
                <li
                  //role="button"
                  //tabIndex={0}
                  className="block-sprite-item"
                  key={index}
                >
                  <div className="block-sprite-svg-wrap">
                    <svg
                      className="block-sprite-svg"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      viewBox={item.viewBox}
                      dangerouslySetInnerHTML={{ __html: item.paths }}
                    />
                  </div>
                  <p className="block-sprite-id">{item.id}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </main>
      <aside className="app-aside">
        <div
          className={
            isDraggingOver ? "block-selection is-over" : "block-selection"
          }
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="block-selection-contents">
            <p className="block-selection-title">
              ファイルをドラッグアンドドロップ
            </p>
            <div className="block-selection-buttons">
              <input
                className="block-selection-button"
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
