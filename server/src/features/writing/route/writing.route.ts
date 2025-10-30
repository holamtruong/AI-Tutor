import express from 'express'
import { writingController } from '../controller/writing.controller'

const writingRoute = express.Router()

writingRoute.post('/evaluate', writingController.evaluate.bind(writingController))

export default writingRoute
