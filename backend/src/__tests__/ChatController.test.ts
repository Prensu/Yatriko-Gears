import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Response } from "express"

const mocks = vi.hoisted(() => {
  process.env.GEMINI_API_KEY = "test-key"
  return {
    generateContent: vi.fn(),
    executeChatTool: vi.fn(),
    findOne: vi.fn(),
  }
})

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent }
  },
  ThinkingLevel: { MINIMAL: "MINIMAL" },
  FunctionCallingConfigMode: { NONE: "NONE" },
}))

vi.mock("../modules/chat/chatTools", () => ({
  CHAT_STATIC_SHOP_INFO: { shopName: "Yatriko Gears", tagline: "Rent the Best, Trek with Confidence" },
  chatFunctionDeclarations: [],
  executeChatTool: mocks.executeChatTool,
}))

class TestSession {
  messages: Array<{ role: "user" | "model"; text: string }>

  constructor(messages: Array<{ role: "user" | "model"; text: string }> = []) {
    this.messages = messages
  }

  set(_key: string, value: Array<{ role: "user" | "model"; text: string }>) {
    this.messages = value
  }

  async save() {
    return this
  }
}

vi.mock("../modules/chat/ChatModel", () => ({
  default: class {
    static findOne = mocks.findOne
    messages: Array<{ role: "user" | "model"; text: string }> = []
    set = TestSession.prototype.set
    save = TestSession.prototype.save
  },
}))

import ChatController, { SYSTEM_PROMPT } from "../modules/chat/ChatController"

function textResponse(text: string) {
  return { text, functionCalls: [], candidates: [{ content: { role: "model", parts: [{ text }] } }] }
}

function toolResponse(name = "searchGear") {
  const functionCall = { id: "call-1", name, args: { query: "tent" } }
  return { functionCalls: [functionCall], candidates: [{ content: { role: "model", parts: [{ functionCall }] } }] }
}

function request(message = "hello") {
  return { body: { message }, loggedInUser: undefined } as never
}

function response() {
  return { json: vi.fn() }
}

describe("ChatController tool loop", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.findOne.mockResolvedValue(new TestSession())
    mocks.executeChatTool.mockResolvedValue({ items: [{ name: "Tent", rentalPricePerNight: 650 }] })
  })

  it("does not embed a hardcoded rupee price in the system prompt", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/Rs\.?\s*\d/i)
  })

  it("returns a plain model answer without calling a tool", async () => {
    mocks.generateContent.mockResolvedValue(textResponse("Hello from Yatriko."))
    const res = response()
    await new ChatController().sendMessage(request(), res as unknown as Response, vi.fn())
    expect(mocks.executeChatTool).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { reply: "Hello from Yatriko.", sessionId: expect.any(String) } }))
  })

  it("executes one tool call, sends its result back, and persists only user/final text", async () => {
    const session = new TestSession()
    mocks.findOne.mockResolvedValue(session)
    mocks.generateContent.mockResolvedValueOnce(toolResponse()).mockResolvedValueOnce(textResponse("Tent is available."))
    const res = response()
    await new ChatController().sendMessage(request("What tents do you have?"), res as unknown as Response, vi.fn())

    expect(mocks.executeChatTool).toHaveBeenCalledWith("searchGear", { query: "tent" })
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    expect(mocks.generateContent.mock.calls[1]?.[0].contents).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "user", parts: [{ functionResponse: expect.objectContaining({ name: "searchGear" }) }] }),
    ]))
    expect(session.messages).toEqual([
      { role: "user", text: "What tents do you have?" },
      { role: "model", text: "Tent is available." },
    ])
  })

  it("lets the model gracefully answer after a tool error", async () => {
    mocks.executeChatTool.mockResolvedValue({ error: "The requested information is temporarily unavailable." })
    mocks.generateContent.mockResolvedValueOnce(toolResponse("getPackages")).mockResolvedValueOnce(textResponse("I couldn't find that right now."))
    const res = response()
    await new ChatController().sendMessage(request("Show packages"), res as unknown as Response, vi.fn())
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reply: "I couldn't find that right now." }) }))
  })

  it("forces a text-only answer after four tool iterations", async () => {
    mocks.generateContent
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(toolResponse())
      .mockResolvedValueOnce(textResponse("I need to hand this to the shop team."))
    const res = response()
    await new ChatController().sendMessage(request("Keep checking"), res as unknown as Response, vi.fn())
    expect(mocks.executeChatTool).toHaveBeenCalledTimes(4)
    expect(mocks.generateContent).toHaveBeenCalledTimes(6)
    expect(mocks.generateContent.mock.calls[5]?.[0].config.tools).toBeUndefined()
  })
})
