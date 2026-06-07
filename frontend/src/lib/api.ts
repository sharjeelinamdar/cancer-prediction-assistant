const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type ChatResponse = {
  response: string;
};

export type UploadResponse = {
  extracted_text: string;
};

export type StructuredParameter = {
  value: number;
  range: [number, number];
  status: "low" | "normal" | "high";
  confidence: "high" | "medium" | "low";
};

export type StructuredParameterInput = {
  value: number;
  range: [number, number];
  status: "low" | "normal" | "high";
};

export type ReportAnalyzeResponse = {
  summary: string;
  risk_level: "Low" | "Moderate" | "High";
  risk_reasons: string[];
  highlighted_keywords: string[];
  structured_data?: Record<string, StructuredParameter>;
  saved_file?: string;
};

export type ReportChatResponse = {
  response: string;
};

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorBody = await safeParseError(response);
    throw new Error(errorBody);
  }

  return (await response.json()) as ChatResponse;
}

export async function uploadReport(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-report`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await safeParseError(response);
    throw new Error(errorBody);
  }

  return (await response.json()) as UploadResponse;
}

export async function analyzeReport(extractedText: string): Promise<ReportAnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/report/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ extracted_text: extractedText }),
  });

  if (!response.ok) {
    const errorBody = await safeParseError(response);
    throw new Error(errorBody);
  }

  return (await response.json()) as ReportAnalyzeResponse;
}

export async function sendReportChatMessage(
  extractedText: string,
  question: string,
  structuredData?: Record<string, StructuredParameterInput>
): Promise<ReportChatResponse> {
  const response = await fetch(`${API_BASE_URL}/report/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ extracted_text: extractedText, question, structured_data: structuredData }),
  });

  if (!response.ok) {
    const errorBody = await safeParseError(response);
    throw new Error(errorBody);
  }

  return (await response.json()) as ReportChatResponse;
}

async function safeParseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    if (data.detail) {
      return data.detail;
    }
  } catch {
    // Ignore parse errors and fallback to status text.
  }

  return response.statusText || "Request failed.";
}
