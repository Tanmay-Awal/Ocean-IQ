import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai"


const apiKey ="AIzaSyC5ko1NcnysVBs25PoUaf3XrhUfrY-ZK-8"; // Hardcoded fallback (not secure)
if (!apiKey) {
  console.error("Missing API key! Set GEMINI_API_KEY in your environment.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function run(prompt) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);

    // Extract response text
    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    console.log("Response:", responseText);

    // Handle any inline data (e.g., images, files)
    const candidates = result.response?.candidates || [];
    for (let candidate_index = 0; candidate_index < candidates.length; candidate_index++) {
      for (let part_index = 0; part_index < (candidates[candidate_index].content?.parts || []).length; part_index++) {
        const part = candidates[candidate_index].content.parts[part_index];
        if (part.inlineData) {
          try {
            const filename = `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData.mimeType)}`;
            fs.writeFileSync(filename, Buffer.from(part.inlineData.data, "base64"));
            console.log(`Output written to: ${filename}`);
          } catch (err) {
            console.error("Error writing file:", err);
          }
        }
      }
    }
    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return "An error occurred while processing the request.";
  }
}

export default run;
