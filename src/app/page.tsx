"use client"

import { useEffect, useRef } from "react"

export default function Home() {
  const textareaRef = useRef<HTMLDivElement>(null)
  const copyBtnRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    const copybtn = copyBtnRef.current
    const tooltip = tooltipRef.current

    if (!textarea || !copybtn || !tooltip) return

    const tooltipTexts: Record<string, string> = {
      // FG
      "30": "Dark Gray (33%)",
      "31": "Red",
      "32": "Yellowish Green",
      "33": "Gold",
      "34": "Light Blue",
      "35": "Pink",
      "36": "Teal",
      "37": "White",
      // BG
      "40": "Blueish Black",
      "41": "Rust Brown",
      "42": "Gray (40%)",
      "43": "Gray (45%)",
      "44": "Light Gray (55%)",
      "45": "Blurple",
      "46": "Light Gray (60%)",
      "47": "Cream White",
    }

    // Some basic escaping of pasted HTML tags
    textarea.oninput = () => {
      const base = textarea.innerHTML.replace(/<(\/?(br|span|span class="ansi-[0-9]*"))>/g, "[$1]")
      if (base.includes("<") || base.includes(">"))
        textarea.innerHTML = base
          .replace(/<.*?>/g, "")
          .replace(/[<>]/g, "")
          .replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g, "<$1>")
    }

    // Handle Enter key for line breaks
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        document.execCommand("insertLineBreak")
        event.preventDefault()
      }
    })

    document.querySelectorAll(".style-button").forEach((btn) => {
      btn.onclick = () => {
        const ansiCode = (btn as HTMLElement).dataset.ansi
        if (!ansiCode) {
          textarea.innerText = textarea.innerText
          return
        }

        const selection = window.getSelection()
        if (!selection) return

        const text = selection.toString()

        const span = document.createElement("span")
        span.innerText = text
        span.classList.add(`ansi-${ansiCode}`)

        if (selection.rangeCount === 0) return; // Prevent error if no selection
        const range = selection.getRangeAt(0);

        range.deleteContents()
        range.insertNode(span)

        range.selectNodeContents(span)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      btn.onmouseenter = () => {
        const ansiCode = (btn as HTMLElement).dataset.ansi
        if (!ansiCode || !(+ansiCode > 4)) return

        const rect = btn.getBoundingClientRect()
        tooltip.style.display = "block"
        tooltip.innerText = tooltipTexts[ansiCode]
        tooltip.style.top = `${rect.top - 36}px`
        tooltip.style.left = `${rect.left - tooltip.clientWidth / 2 + btn.clientWidth / 2}px`
      }

      btn.onmouseleave = () => {
        tooltip.style.display = "none"
      }
    })

    function nodesToANSI(
      nodes: NodeListOf<ChildNode> | HTMLCollection,
      states: Array<{ fg: number; bg: number; st: number }>,
    ) {
      let text = ""
      for (const node of Array.from(nodes)) {
        if (node.nodeType === 3) {
          text += node.textContent
          continue
        }
        if ((node as HTMLElement).nodeName === "BR") {
          text += "\n"
          continue
        }
        const className = (node as HTMLElement).className || "";
        const classParts = className.split("-");
        if (classParts.length < 2) continue; 

        const ansiCode = +classParts[1];

        const newState = Object.assign({}, states.at(-1))

        if (ansiCode < 30) newState.st = ansiCode
        if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode
        if (ansiCode >= 40) newState.bg = ansiCode

        states.push(newState)
        text += `\x1b[${newState.st};${ansiCode >= 40 ? newState.bg : newState.fg}m`
        text += nodesToANSI(node.childNodes, states)
        states.pop()
        text += `\x1b[0m`
        if (states.at(-1)!.fg !== 2) text += `\x1b[${states.at(-1)!.st};${states.at(-1)!.fg}m`
        if (states.at(-1)!.bg !== 2) text += `\x1b[${states.at(-1)!.st};${states.at(-1)!.bg}m`
      }
      return text
    }

    let copyCount = 0
    let copyTimeout: NodeJS.Timeout | null = null

    copybtn.onclick = () => {
      const toCopy = "```ansi\n" + nodesToANSI(textarea.childNodes, [{ fg: 2, bg: 2, st: 2 }]) + "\n```"
      navigator.clipboard.writeText(toCopy).then(
        () => {
          if (copyTimeout) clearTimeout(copyTimeout)

          const funnyCopyMessages = [
            "Copied!",
            "Double Copy!",
            "Triple Copy!",
            "Dominating!!",
            "Rampage!!",
            "Mega Copy!!",
            "Unstoppable!!",
            "Wicked Sick!!",
            "Monster Copy!!!",
            "GODLIKE!!!",
            "BEYOND GODLIKE!!!!",
            Array(16)
              .fill(0)
              .reduce((p) => p + String.fromCharCode(Math.floor(Math.random() * 65535)), ""),
          ]

          copybtn.style.backgroundColor = copyCount <= 8 ? "#3BA55D" : "#ED4245"
          copybtn.innerText = funnyCopyMessages[copyCount]
          copyCount = Math.min(11, copyCount + 1)
          copyTimeout = setTimeout(() => {
            copyCount = 0
            copybtn.style.backgroundColor = ""
            copybtn.innerText = "Copy text as Discord formatted"
          }, 2000)
        },
        (err) => {
          if (copyCount > 2) return
          alert("Copying failed for some reason, let's try showing an alert, maybe you can copy it instead.")
          alert(toCopy)
        },
      )
    }
  }, [])

  return (
    <div className="bg-[#36393F] text-white text-center font-sans">
      <h1 className="text-3xl font-semibold mt-4">
        Rebane&apos;s Discord <span className="text-[#5865F2]">Colored</span> Text Generator
      </h1>

      <div className="max-w-[500px] mx-auto">
        <h3 className="text-xl mt-4">About</h3>
        <p className="mt-2">
          This is a simple app that creates colored Discord messages using the ANSI color codes available on the latest
          Discord desktop versions.
        </p>
        <p className="mt-2">
          To use this, write your text, select parts of it and assign colors to them, then copy it using the button
          below, and send in a Discord message.
        </p>

        <h3 className="text-xl mt-4">Source Code</h3>
        <p className="mt-2">
          This app runs entirely in your browser and the source code is freely available on{" "}
          <a href="https://gist.github.com/rebane2001/07f2d8e80df053c70a1576d27eabe97c" className="text-[#00AFF4]">
            GitHub
          </a>
          . Shout out to kkrypt0nn for{" "}
          <a href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" className="text-[#00AFF4]">
            this guide
          </a>
          .
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-4">Create your text</h2>

      <div className="mt-3 flex gap-x-2">
        <button
          data-ansi="0"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded space-x-2 px-4 py-0.5 text-white bg-[#4f545c] text-sm cursor-pointer transition-colors duration-250"
        >
          Reset All
        </button>
        <button
          data-ansi="1"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#4f545c] text-sm cursor-pointer transition-colors duration-250 font-bold"
        >
          Bold
        </button>
        <button
          data-ansi="4"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#4f545c] text-sm cursor-pointer transition-colors duration-250 underline font-medium"
        >
          Line
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <strong className="mr-2">FG</strong>
        <button
          data-ansi="30"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#4f545c] text-sm cursor-pointer transition-colors duration-250 ansi-30-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="31"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#dc322f] text-sm cursor-pointer transition-colors duration-250 ansi-31-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="32"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#859900] text-sm cursor-pointer transition-colors duration-250 ansi-32-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="33"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#b58900] text-sm cursor-pointer transition-colors duration-250 ansi-33-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="34"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#268bd2] text-sm cursor-pointer transition-colors duration-250 ansi-34-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="35"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#d33682] text-sm cursor-pointer transition-colors duration-250 ansi-35-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="36"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#2aa198] text-sm cursor-pointer transition-colors duration-250 ansi-36-bg"
        >
          &nbsp;
        </button>
        <button
          data-ansi="37"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#ffffff] text-sm cursor-pointer transition-colors duration-250 ansi-37-bg"
        >
          &nbsp;
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <strong className="mr-2">BG</strong>
        <button
          data-ansi="40"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#002b36] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="41"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#cb4b16] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="42"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#586e75] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="43"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#657b83] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="44"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#839496] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="45"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#6c71c4] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="46"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#93a1a1] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
        <button
          data-ansi="47"
          className="style-button min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#fdf6e3] text-sm cursor-pointer transition-colors duration-250"
        >
          &nbsp;
        </button>
      </div>

      <div className="flex items-center justify-center mt-4">
        <div
          id="textarea"
          ref={textareaRef}
          contentEditable="true"
          suppressContentEditableWarning={true}
          className="w-[600px] h-[200px] rounded resize overflow-auto text-left font-mono bg-[#2F3136] text-[#B9BBBE] border border-[#202225] p-[5px] inline-block whitespace-pre-wrap text-[0.875rem] leading-[1.125rem]"
        >
          Welcome to&nbsp;<span className="ansi-33 text-[#b58900]">Rebane</span>&apos;s{" "}
          <span className="ansi-45 bg-[#6c71c4]">
            <span className="ansi-37 text-[#ffffff]">Discord</span>
          </span>
          &nbsp;<span className="ansi-31 text-[#dc322f]">C</span>
          <span className="ansi-32 text-[#859900]">o</span>
          <span className="ansi-33 text-[#b58900]">l</span>
          <span className="ansi-34 text-[#268bd2]">o</span>
          <span className="ansi-35 text-[#d33682]">r</span>
          <span className="ansi-36 text-[#2aa198]">e</span>
          <span className="ansi-37 text-[#ffffff]">d</span>&nbsp;Text Generator!
        </div>
      </div>

      <div className="mt-4">
        <button
          ref={copyBtnRef}
          className="min-h-[32px] min-w-[32px] border-none rounded px-4 py-0.5 text-white bg-[#4f545c] text-sm cursor-pointer transition-colors duration-250"
        >
          Copy text as Discord formatted
        </button>
      </div>

      <div className="mt-4 mb-8">
        <small>This is an unofficial tool, it is not made or endorsed by Discord.</small>
      </div>

      <div
        ref={tooltipRef}
        className="hidden absolute bg-[#3BA55D] border-none rounded text-white text-sm py-2 px-4 top-0"
      >
        Tooltip
      </div>

      <style jsx global>{`
        .ansi-1 { font-weight: 700; text-decoration: none; }
        .ansi-4 { font-weight: 500; text-decoration: underline; }
        
        .ansi-30 { color: #4f545c; }
        .ansi-31 { color: #dc322f; }
        .ansi-32 { color: #859900; }
        .ansi-33 { color: #b58900; }
        .ansi-34 { color: #268bd2; }
        .ansi-35 { color: #d33682; }
        .ansi-36 { color: #2aa198; }
        .ansi-37 { color: #ffffff; }
        
        .ansi-30-bg { background-color: #4f545c; }
        .ansi-31-bg { background-color: #dc322f; }
        .ansi-32-bg { background-color: #859900; }
        .ansi-33-bg { background-color: #b58900; }
        .ansi-34-bg { background-color: #268bd2; }
        .ansi-35-bg { background-color: #d33682; }
        .ansi-36-bg { background-color: #2aa198; }
        .ansi-37-bg { background-color: #ffffff; }
      `}</style>
    </div>
  )
}

