import axios from "axios";

export async function askOllama(prompt: string) {
  try {
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "qwen2.5-coder:7b",
        prompt,
        stream: false,
      }
    );

    return response.data.response || "";
  } catch (error) {
    console.error(error);
    return "Ollama Error";
  }
}