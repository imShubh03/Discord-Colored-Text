"use client"

import { useEffect, useRef } from "react"
import { Title, Text, Container, Button, Group, Box, Anchor, Flex, Center } from "@mantine/core"

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

        if (selection.rangeCount === 0) return // Prevent error if no selection
        const range = selection.getRangeAt(0)

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
        const className = (node as HTMLElement).className || ""
        const classParts = className.split("-")
        if (classParts.length < 2) continue

        const ansiCode = +classParts[1]

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
          alert(err)
        },
      )
    }
  }, [])

  return (
    <>
      <Box bg="#36393F" c="white" style={{ textAlign: "center", minHeight: "100vh" }}>
        <Container size="lg" pt="md">
          <Title order={1} fw={600} mt="md" c="white">
            Rebane&apos;s Discord{" "}
            <Text span c="#5865F2" inherit>
              Colored
            </Text>{" "}
            Text Generator
          </Title>

          <Container size="sm" mx="auto">
            <Title order={3} mt="lg">
              About
            </Title>
            <Text mt="xs">
              This is a simple app that creates colored Discord messages using the <br />
              ANSI color codes available on the latest Discord desktop versions.
            </Text>
            <Text mt="xs">
              To use this, write your text, select parts of it and assign colors to them,<br />
              then copy it using the button below, and send in a Discord message.
            </Text>

            <Title order={3} mt="lg">
              Source Code
            </Title>
            <Text mt="xs">
              This app runs entirely in your browser and the source code is freely <br />
              available on{" "}
              <Anchor href="https://gist.github.com/rebane2001/07f2d8e80df053c70a1576d27eabe97c" style={{ textDecoration: "underline" }}
                c="#00AFF4">
                GitHub
              </Anchor>
              . Shout out to kkrypt0nn for{" "}
              <Anchor href="https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06" style={{ textDecoration: "underline" }}
                c="#00AFF4">
                this guide
              </Anchor>
              .
            </Text>
          </Container>

          <Title order={2} fw={600} mt="lg">
            Create your text
          </Title>

          <Group position="center" mt="sm" spacing="xs" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Button
              data-ansi="0"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#4f545c",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              Reset All
            </Button>
            <Button
              data-ansi="1"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#4f545c",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                  fontWeight: 700,
                },
              }}
            >
              Bold
            </Button>
            <Button
              data-ansi="4"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#4f545c",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                  textDecoration: "underline",
                  fontWeight: 500,
                },
              }}
            >
              Line
            </Button>
          </Group>


          <Flex align="center" justify="center" mt="md" gap="3px">
            <Text fw={700} mr="xs">
              FG
            </Text>
            <Button
              data-ansi="30"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#4f545c",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="31"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#dc322f",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="32"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#859900",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="33"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#b58900",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="34"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#268bd2",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="35"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#d33682",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="36"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#2aa198",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="37"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#ffffff",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
          </Flex>

          <Flex align="center" justify="center" mt="md" gap="3px">
            <Text fw={700} mr="xs">
              BG
            </Text>
            <Button
              data-ansi="40"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#002b36",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="41"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#cb4b16",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="42"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#586e75",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="43"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#657b83",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="44"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#839496",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="45"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#6c71c4",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="46"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#93a1a1",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
            <Button
              data-ansi="47"
              className="style-button"
              styles={{
                root: {
                  backgroundColor: "#fdf6e3",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              &nbsp;
            </Button>
          </Flex>

          <Center mt="md">
            <div
              id="textarea"
              ref={textareaRef}
              contentEditable="true"
              suppressContentEditableWarning={true}
              style={{
                width: "600px",
                height: "200px",
                borderRadius: "5px",
                resize: "both",
                overflow: "auto",
                textAlign: "left",
                fontFamily: "monospace",
                backgroundColor: "#2F3136",
                color: "#B9BBBE",
                border: "#202225 1px solid",
                padding: "5px",
                display: "inline-block",
                whiteSpace: "pre-wrap",
                fontSize: "0.875rem",
                lineHeight: "1.125rem",
              }}
            >
              Welcome to&nbsp;<span className="ansi-33">Rebane</span>&apos;s{" "}
              <span className="ansi-45">
                <span className="ansi-37">Discord</span>
              </span>
              &nbsp;<span className="ansi-31">C</span>
              <span className="ansi-32">o</span>
              <span className="ansi-33">l</span>
              <span className="ansi-34">o</span>
              <span className="ansi-35">r</span>
              <span className="ansi-36">e</span>
              <span className="ansi-37">d</span>&nbsp;Text Generator!
            </div>
          </Center>

          <Box mt="md">
            <Button
              ref={copyBtnRef}
              styles={{
                root: {
                  backgroundColor: "#4f545c",
                  minHeight: "32px",
                  minWidth: "32px",
                  border: "none",
                  borderRadius: "3px",
                  padding: "2px 16px",
                  fontSize: "14px",
                  transition: "background-color 250ms linear",
                },
              }}
            >
              Copy text as Discord formatted
            </Button>
          </Box>

          <Text size="xs" mt="md" mb="xl">
            This is an unofficial tool, it is not made or endorsed by Discord.
          </Text>

          <div
            ref={tooltipRef}
            style={{
              display: "none",
              position: "absolute",
              backgroundColor: "#3BA55D",
              border: "none",
              borderRadius: "3px",
              color: "#fff",
              fontSize: "14px",
              padding: "8px 16px",
              top: 0,
            }}
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
          
          .ansi-40 { background-color: #002b36; }
          .ansi-41 { background-color: #cb4b16; }
          .ansi-42 { background-color: #586e75; }
          .ansi-43 { background-color: #657b83; }
          .ansi-44 { background-color: #839496; }
          .ansi-45 { background-color: #6c71c4; }
          .ansi-46 { background-color: #93a1a1; }
          .ansi-47 { background-color: #fdf6e3; }
        `}</style>
        </Container>
      </Box>
    </>
  )
}

