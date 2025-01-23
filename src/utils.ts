import type { Config } from "svgo"

type Optimize = (
  code: string,
  config: Config
) => {
  data: string
}

type SvgFile = {
  fileName: string
  code: string
}

type Symbol = {
  id: string
  viewBox: string
  paths: string
}

export type Sprite = {
  fileName: string
  symbols: Symbol[]
}

export function getName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".")
  return lastDotIndex === -1 ? fileName : fileName.slice(0, lastDotIndex)
}

export async function readSvgFiles(files: File[]) {
  const fileReadPromises = files.map((file) => {
    if (!file.name.endsWith(".svg")) return null

    return new Promise<SvgFile | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          resolve({ fileName: file.name, code: e.target.result })
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    })
  })
  const results = await Promise.all(fileReadPromises)
  return results.filter((file): file is SvgFile => file !== null)
}

export async function optimizeSvgFiles(svgFiles: SvgFile[]) {
  const { optimize }: { optimize: Optimize } = await import(
    "svgo/dist/svgo.browser" as any
  )
  return svgFiles.map((svgFile) => {
    return {
      ...svgFile,
      code: optimize(svgFile.code, {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeHiddenElems: false, // `removeUnusedDefs` を無効化
              },
            },
          },
          { name: "removeScriptElement" },
          { name: "removeXMLNS" },
        ],
      }).data,
    } as SvgFile
  })
}

export function parseSymbols(fileName: string, code: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(code, "image/svg+xml")
  const hasSymbol = doc.querySelector("symbol") ? true : false
  const hasSvg = doc.querySelector("svg") ? true : false

  let symbols: Symbol[] = []
  let isSprite = false

  if (hasSymbol) {
    const symbolEls = Array.from(doc.querySelectorAll("symbol"))

    symbolEls.forEach((symbolEl) => {
      const id = symbolEl.getAttribute("id") || ""
      const viewBox = symbolEl.getAttribute("viewBox") || ""
      const paths = symbolEl.innerHTML || ""

      if (id && viewBox && paths) {
        symbols.push({ id, viewBox, paths })
      }
    })
    isSprite = true
  } else if (hasSvg) {
    const svgEl = doc.querySelector("svg")

    const id = svgEl.getAttribute("id") || getName(fileName) || ""
    const viewBox = svgEl.getAttribute("viewBox") || ""
    const paths = svgEl.innerHTML || ""

    if (id && viewBox && paths) {
      symbols.push({ id, viewBox, paths })
    }
  }
  return { symbols, isSprite }
}

export function sortSymbols(symbols: Symbol[]) {
  return symbols.sort((a, b) => {
    if (a.id < b.id) return -1
    if (a.id > b.id) return 1
    return 0
  })
}

export function generateSpriteCode(symbols: Symbol[]) {
  const sortedSymbols = [...sortSymbols(symbols)]
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
<defs>
${sortedSymbols
  .map(
    (symbol) => `<symbol id="${symbol.id}" viewBox="${symbol.viewBox}">
${symbol.paths}
</symbol>`
  )
  .join("\n")}
</defs>
</svg>`
}

export function generateSvgCode(symbol: Symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${symbol.viewBox}">
${symbol.paths}
</svg>`
}
