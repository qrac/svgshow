import { useState, useRef } from "react"
import { SiGithub } from "react-icons/si"
import { clsx } from "clsx"
import { FiEdit3, FiX, FiDownload, FiTrash2, FiPlus } from "react-icons/fi"

import type { Sprite } from "./utils"
import {
  getName,
  readSvgFiles,
  optimizeSvgFiles,
  parseSymbols,
  generateSpriteCode,
  generateSvgCode,
} from "./utils"

import "./app.css"
import { version, repository } from "../package.json"

export default function App() {
  const [sprites, setSprites] = useState<Sprite[]>([])
  const [dragging, setDragging] = useState("")
  const [editing, setEditing] = useState<{
    spriteIndex: number
    symbolIndex?: number
  } | null>(null)
  const addSpriteRef = useRef<HTMLInputElement>(null)
  const addSymbolRefs = useRef<HTMLInputElement[]>([])

  async function uploadFiles(
    files: File[],
    targetName: string,
    spriteIndex?: number
  ) {
    const svgFiles = await readSvgFiles(files)
    const optimizedSvgFiles = await optimizeSvgFiles(svgFiles)

    if (targetName === "sprite") {
      optimizedSvgFiles.forEach((svgFile) => {
        const { symbols, isSprite } = parseSymbols(
          svgFile.fileName,
          svgFile.code
        )
        const fileName = isSprite ? getName(svgFile.fileName) : "sprite"
        setSprites((current) => [...current, { fileName, symbols }])
      })
      addSpriteRef.current && (addSpriteRef.current.value = "")
    }
    if (targetName === "symbol" && spriteIndex !== undefined) {
      optimizedSvgFiles.forEach((svgFile) => {
        const { symbols } = parseSymbols(svgFile.fileName, svgFile.code)
        setSprites((current) =>
          current.map((sprite, i) =>
            i === spriteIndex
              ? { ...sprite, symbols: [...sprite.symbols, ...symbols] }
              : sprite
          )
        )
      })
    }
  }

  function handleEditStart(spriteIndex: number, symbolIndex?: number) {
    setEditing({ spriteIndex, symbolIndex })
  }

  function handleEditEnd(
    newValue: string,
    spriteIndex: number,
    symbolIndex?: number
  ) {
    setEditing(null)

    if (symbolIndex === undefined) {
      setSprites((current) =>
        current.map((sprite, i) => {
          if (i === spriteIndex) {
            return { ...sprite, fileName: newValue }
          } else {
            return sprite
          }
        })
      )
    } else {
      setSprites((current) =>
        current.map((sprite, i) => {
          if (i === spriteIndex) {
            return {
              ...sprite,
              symbols: sprite.symbols.map((symbol, j) =>
                j === symbolIndex ? { ...symbol, id: newValue } : symbol
              ),
            }
          } else {
            return sprite
          }
        })
      )
    }
  }

  function handleRemove(spriteIndex: number, symbolIndex?: number) {
    if (symbolIndex === undefined) {
      setSprites((current) => current.filter((_, i) => i !== spriteIndex))
    } else {
      setSprites((current) =>
        current.map((sprite, i) => {
          if (i === spriteIndex) {
            return {
              ...sprite,
              symbols: sprite.symbols.filter((_, j) => j !== symbolIndex),
            }
          } else {
            return sprite
          }
        })
      )
    }
  }

  function handleDownload(spriteIndex: number, symbolIndex?: number) {
    if (symbolIndex === undefined) {
      const sprite = sprites[spriteIndex]
      const code = generateSpriteCode(sprite.symbols)
      const blob = new Blob([code], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = sprite.fileName + ".svg"
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const sprite = sprites[spriteIndex]
      const symbol = sprite.symbols[symbolIndex]
      const code = generateSvgCode(symbol)
      const blob = new Blob([code], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = symbol.id + ".svg"
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  function handleDragOver(
    e: React.DragEvent<HTMLDivElement>,
    targetName: string,
    spriteIndex?: number
  ) {
    e.preventDefault()
    const indesStr = spriteIndex === undefined ? "" : `-${spriteIndex}`
    setDragging(targetName + indesStr)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging("")
  }

  async function handleDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetName: string,
    spriteIndex?: number
  ) {
    e.preventDefault()
    setDragging("")
    const files = [...e.dataTransfer.files]
    if (files.length === 0) return
    await uploadFiles(files, targetName, spriteIndex)
    e.dataTransfer.clearData()
  }

  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    targetName: string,
    spriteIndex?: number
  ) {
    const files = [...e.target.files]
    if (files.length === 0) return
    await uploadFiles(files, targetName, spriteIndex)
  }

  function handleNew() {
    setSprites((current) => [
      ...current,
      {
        fileName: "sprite",
        symbols: [],
      },
    ])
  }
  return (
    <div className="app">
      <header className="box is-flex is-middle is-gap-md is-nt-sm">
        <div className="box is-flex is-baseline is-gap-x-sm is-flex-0">
          <h1 className="logo">
            <span>
              <span className="logo-text is-ac-1">svg</span>
              <span className="logo-text is-ac-2">show</span>
            </span>
          </h1>
          <p className="text is-xs">v{version}</p>
          <h2 className="text is-xs">ブラウザでSVGスプライトファイルを編集</h2>
        </div>
        <div className="box is-flex is-middle">
          <a
            href={repository.url}
            target="_blank"
            className="box is-flex is-middle"
          >
            <SiGithub className="icon is-lg" />
          </a>
        </div>
      </header>

      <main className="box is-space-xxl">
        {sprites.map((sprite, spriteIndex) => (
          <div className="box is-space-sm" key={spriteIndex}>
            <div className="box is-flex is-between is-middle is-gap-x-md">
              <div className="box is-flex is-middle is-gap-xxs">
                {editing?.spriteIndex === spriteIndex &&
                editing?.symbolIndex === undefined ? (
                  <div className="text is-mono">
                    <input
                      type="text"
                      className="input is-sm"
                      defaultValue={sprite.fileName}
                      onBlur={(e) =>
                        handleEditEnd(e.target.value, spriteIndex, undefined)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEditEnd(
                            e.currentTarget.value,
                            spriteIndex,
                            undefined
                          )
                        }
                      }}
                      autoFocus
                    />
                    <span className="text">.svg</span>
                  </div>
                ) : (
                  <div className="text is-mono">
                    <span className="text">{sprite.fileName}</span>
                    <span className="text">.svg</span>
                  </div>
                )}
                <button
                  type="button"
                  className="button is-melt is-circle is-sm"
                  onClick={() => handleEditStart(spriteIndex)}
                >
                  <FiEdit3 className="icon" />
                </button>
              </div>
              <div className="box is-flex is-middle is-gap-xxs">
                <button
                  type="button"
                  className="button is-outline is-xs"
                  onClick={() => handleRemove(spriteIndex)}
                >
                  <FiX className="icon" />
                  <span className="text">表示を解除</span>
                </button>
                <button
                  type="button"
                  className="button is-outline is-primary is-xs"
                  onClick={() => handleDownload(spriteIndex)}
                >
                  <FiDownload className="icon" />
                  <span className="text">ダウンロード</span>
                </button>
              </div>
            </div>
            <ul className="sprite-items">
              {sprite.symbols.map((symbol, symbolIndex) => (
                <li className="sprite-item" key={symbolIndex}>
                  <button
                    type="button"
                    className="button is-delete is-melt is-danger is-square is-xs"
                    onClick={() => handleRemove(spriteIndex, symbolIndex)}
                  >
                    <FiTrash2 className="icon" />
                  </button>
                  <div className="box is-pt-xxl is-pb-lg is-px-sm is-space-sm">
                    <div className="box">
                      <svg
                        className="sprite-svg"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={symbol.viewBox}
                        dangerouslySetInnerHTML={{ __html: symbol.paths }}
                      />
                    </div>
                    {editing?.spriteIndex === spriteIndex &&
                    editing?.symbolIndex === symbolIndex ? (
                      <div className="box is-flex is-mono">
                        <input
                          type="text"
                          className="input is-flex-full is-xs"
                          defaultValue={symbol.id}
                          onBlur={(e) =>
                            handleEditEnd(
                              e.target.value,
                              spriteIndex,
                              symbolIndex
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditEnd(
                                e.currentTarget.value,
                                spriteIndex,
                                symbolIndex
                              )
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="text is-mono is-center is-line-height-xs is-xs">
                        {symbol.id}
                      </p>
                    )}
                  </div>
                  <div className="box is-flex is-outline-top">
                    <button
                      type="button"
                      className="button is-edit is-melt is-flex-0 is-xxs"
                      onClick={() => handleEditStart(spriteIndex, symbolIndex)}
                    >
                      <FiEdit3 className="icon" />
                      <span className="text is-mono is-py-xxs">ID</span>
                    </button>
                    <div className="box is-outline-left" />
                    <button
                      type="button"
                      className="button is-download is-melt is-flex-0 is-xxs"
                      onClick={() => handleDownload(spriteIndex, symbolIndex)}
                    >
                      <FiDownload className="icon" />
                      <span className="text is-mono is-py-xxs">SVG</span>
                    </button>
                  </div>
                </li>
              ))}
              <div
                className={clsx(
                  "selection is-min-height-150px",
                  dragging === `symbol-${spriteIndex}` && "is-over"
                )}
                data-name="symbol"
                onDragOver={(e) => handleDragOver(e, "symbol", spriteIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "symbol", spriteIndex)}
              >
                <div className="box is-space-sm">
                  <p className="text is-mono is-center is-xs">Drag & Drop</p>
                  <div className="box is-flex is-center">
                    <button
                      className="button is-outline is-sm"
                      type="button"
                      onClick={() =>
                        addSymbolRefs.current[spriteIndex]?.click()
                      }
                    >
                      <FiPlus className="icon" />
                      <span className="text">追加</span>
                    </button>
                    <input
                      type="file"
                      style={{ display: "none" }}
                      ref={(el) => {
                        if (el) addSymbolRefs.current[spriteIndex] = el
                      }}
                      multiple
                      onChange={(e) => handleFile(e, "symbol", spriteIndex)}
                    />
                  </div>
                </div>
              </div>
            </ul>
          </div>
        ))}
      </main>

      <aside className="box">
        <div
          className={clsx(
            "selection is-min-height-30vh",
            dragging === "sprite" && "is-over"
          )}
          data-name="sprite"
          onDragOver={(e) => handleDragOver(e, "sprite")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "sprite")}
        >
          <div className="box is-space-md">
            <p className="text is-mono is-center is-sm">Drag and Drop Area</p>
            <div className="box is-flex is-middle is-center is-gap-sm">
              <input
                className="button is-outline is-sm"
                type="button"
                value="ファイルを選択"
                onClick={() => addSpriteRef.current?.click()}
              />
              <input
                type="file"
                style={{ display: "none" }}
                ref={addSpriteRef}
                multiple
                onChange={(e) => handleFile(e, "sprite")}
              />
              <span className="text is-sm">or</span>
              <button
                className="button is-plain is-primary is-sm"
                type="button"
                onClick={handleNew}
              >
                新規作成
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
