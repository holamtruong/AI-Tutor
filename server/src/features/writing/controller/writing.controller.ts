import { Request, Response } from 'express'
import OpenAI from 'openai'
import { HTTP_STATUS } from '~/constants/http'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface EvaluationPayload {
  title: string
  content: string
}

interface EvaluationResponse {
  score?: number
  feedback?: string
}

class WritingController {
  public async evaluate(req: Request<unknown, unknown, EvaluationPayload>, res: Response) {
    const { title, content } = req.body ?? {}

    if (!content || typeof content !== 'string' || !content.trim()) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: 'Content is required for evaluation.' })
      return
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an English writing evaluator. Given a learner's writing, assign a holistic score from 0 to 10 (integer) and provide clear, constructive feedback that covers grammar, vocabulary, cohesion, and suggestions for improvement. Always respond strictly in JSON with keys "score" (integer) and "feedback" (string).`
          },
          {
            role: 'user',
            content: `Title: ${title?.trim() ?? 'Untitled'}\nContent:\n${content.trim()}`
          }
        ]
      })

      const messageContent = completion.choices[0]?.message?.content ?? ''

      let parsed: EvaluationResponse = {}
      try {
        parsed = JSON.parse(messageContent)
      } catch (parseError) {
        console.warn('Failed to parse evaluation response', parseError)
      }

      const score =
        typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 10
          ? Math.round(parsed.score)
          : undefined

      const feedback =
        typeof parsed.feedback === 'string' && parsed.feedback.trim().length
          ? parsed.feedback.trim()
          : undefined

      if (typeof score === 'number' && feedback) {
        res.status(HTTP_STATUS.OK).json({ score, feedback })
        return
      }

      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ error: 'Model returned invalid evaluation.' })
    } catch (error) {
      console.error('Failed to evaluate writing', error)
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'OpenAI Error' })
    }
  }
}

export const writingController = new WritingController()
