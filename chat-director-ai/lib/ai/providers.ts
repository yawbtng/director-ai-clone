import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': google('gemini-1.5-flash'),
        'chat-model-reasoning': wrapLanguageModel({
          model: google('gemini-1.5-pro'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': google('gemini-1.5-flash'),
        'artifact-model': google('gemini-1.5-pro'),
      },
    });