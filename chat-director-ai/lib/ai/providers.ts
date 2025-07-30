import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment, isDevelopmentEnvironment } from '../constants';

// Helper function to add supportedUrls to Google models
const addSupportedUrls = (model: any) => ({
  ...model,
  supportedUrls: {},
});

// Create a simple mock provider for development when no API keys are available
const createMockProvider = () => customProvider({
  languageModels: {
    'chat-model': addSupportedUrls(google('gemini-1.5-flash')),
    'chat-model-reasoning': addSupportedUrls(google('gemini-1.5-flash')),
    'title-model': addSupportedUrls(google('gemini-1.5-flash')),
    'artifact-model': addSupportedUrls(google('gemini-1.5-flash')),
  },
});

export const myProvider = isTestEnvironment || isDevelopmentEnvironment
  ? createMockProvider()
  : customProvider({
      languageModels: {
        'chat-model': addSupportedUrls(google('gemini-1.5-flash')),
        'chat-model-reasoning': wrapLanguageModel({
          model: addSupportedUrls(google('gemini-1.5-pro')),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': addSupportedUrls(google('gemini-1.5-flash')),
        'artifact-model': addSupportedUrls(google('gemini-1.5-pro')),
      },
    });