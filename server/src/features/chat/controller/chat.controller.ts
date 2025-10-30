import { Request, Response } from 'express'
import OpenAI from 'openai'
import { HTTP_STATUS } from '~/constants/http'
import 'dotenv/config'
import fs from 'fs'
import { File as NodeFile } from 'node:buffer'
;(globalThis as any).File = NodeFile

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

class ChatController {
  public async chat(req: Request, res: Response) {
    const { message, history } = req.body as {
      message?: string
      history?: Array<{ role?: string; content?: string }>
    }

    if (!message) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing message' })
      return
    }

    const sanitizedHistory =
      Array.isArray(history)
        ? history
            .filter(
              (item): item is { role: 'user' | 'assistant'; content: string } =>
                (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string'
            )
            .map(({ role, content }) => ({ role, content }))
        : []

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert English tutor guiding learners to improve their speaking. Always reply only in English. For every learner message: respond naturally in an encouraging tone, identify any grammar, vocabulary, or pronunciation mistakes, provide concise corrections with improved phrasing, and give brief explanations that build confidence. Respond STRICTLY in JSON with keys "reply" (string) and "followUpQuestions" (string array of up to 3 concise questions that keep the conversation going at the learner's level). In your "reply", include a clearly labeled "Corrections:" section only when there are actual mistakes to mention; omit the section entirely if there are none.`
          },
          ...sanitizedHistory,
          { role: 'user', content: message }
        ]
      })

      const content = completion.choices[0]?.message?.content ?? ''
      let parsed: { reply?: string; followUpQuestions?: string[] } = {}

      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        console.warn('Failed to parse tutor response as JSON', parseError)
      }

      const reply = typeof parsed.reply === 'string' && parsed.reply.trim().length > 0 ? parsed.reply : content
      const followUpQuestions =
        Array.isArray(parsed.followUpQuestions) && parsed.followUpQuestions.every((item) => typeof item === 'string')
          ? parsed.followUpQuestions
          : []

      res.status(HTTP_STATUS.OK).json({ reply, followUpQuestions })
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'OpenAI Error' })
    }
  }

  public async whisper(req: Request, res: Response) {
    try {
      const filePath = req.file?.path
      const fileName = req.file?.originalname

      if (!filePath || !fileName) {
        res.status(400).json({ error: 'No file uploaded' })
        return
      }

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: 'en'
      })

      fs.unlink(filePath, () => {})

      res.status(200).json({ transcript: transcription.text })
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'OpenAI Error' })
    }
  }
}

export const chatController: ChatController = new ChatController()
