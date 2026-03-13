/**
 * AI Provider abstraction — supports swapping Claude/GPT-4o/Gemini.
 */

export interface AIRecognitionRequest {
  imageBase64: string; // raw base64 (no data: prefix)
  mediaType: string; // e.g. 'image/jpeg'
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface AIRecognizedComponent {
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  props: Record<string, unknown>;
}

export interface AIRecognitionResult {
  components: AIRecognizedComponent[];
  background?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  layoutDescription?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
}

export interface AIStreamEvent {
  type: 'component' | 'progress' | 'complete' | 'error';
  data?: AIRecognizedComponent;
  index?: number;
  total?: number;
  message?: string;
  result?: AIRecognitionResult;
}

export interface AIProvider {
  name: string;
  recognize(request: AIRecognitionRequest): Promise<AIRecognitionResult>;
  recognizeStream?(
    request: AIRecognitionRequest,
    onEvent: (event: AIStreamEvent) => void,
  ): Promise<AIRecognitionResult>;
}
