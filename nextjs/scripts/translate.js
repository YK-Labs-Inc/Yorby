require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("🚀 Starting translation...");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const TARGET_LANGUAGES = [
  "Mandarin Chinese",
  "Spanish",
  "French",
  "Korean",
  "Japanese",
];

const LANGUAGE_TO_CODE = {
  "Mandarin Chinese": "zh",
  Spanish: "es",
  French: "fr",
  Korean: "ko",
  Japanese: "jp",
};

async function translateText(text, targetLanguage) {
  try {
    const prompt = `Translate the following text to ${targetLanguage}. Maintain any special characters or emojis. Return only the translation, nothing else:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Translation error for text "${text}":`, error);
    throw error;
  }
}

async function loadExistingTranslation(langCode) {
  try {
    const filePath = path.join(__dirname, `../messages/${langCode}.json`);
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, create it with an empty object
      const filePath = path.join(__dirname, `../messages/${langCode}.json`);
      await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf8");
      console.log(`Created new translation file: ${langCode}.json`);
      return {};
    }
    // If there's any other error, throw it
    throw error;
  }
}

function findNewStrings(sourceObj, targetObj, prefix = "") {
  const newStrings = {};

  for (const key in sourceObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof sourceObj[key] === "object" && sourceObj[key] !== null) {
      // If the key doesn't exist at all in target, add all nested strings
      if (!targetObj || !targetObj[key]) {
        const flattenObject = (obj, path = "") => {
          let result = {};
          for (const k in obj) {
            const newPath = path ? `${path}.${k}` : k;
            if (typeof obj[k] === "object" && obj[k] !== null) {
              Object.assign(result, flattenObject(obj[k], newPath));
            } else {
              result[newPath] = obj[k];
            }
          }
          return result;
        };
        Object.assign(newStrings, flattenObject(sourceObj[key], currentPath));
      } else {
        // Recursively check nested objects
        Object.assign(
          newStrings,
          findNewStrings(sourceObj[key], targetObj[key], currentPath)
        );
      }
    } else if (!targetObj || !(key in targetObj)) {
      // Add leaf node strings that don't exist in target
      newStrings[currentPath] = sourceObj[key];
    }
  }

  return newStrings;
}

function getNestedValue(obj, path) {
  return path
    .split(".")
    .reduce(
      (current, key) =>
        current && current[key] !== undefined ? current[key] : undefined,
      obj
    );
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

const MAX_RETRIES = 3;
const CONCURRENT_BATCH_SIZE = 10;

async function translateNewStrings(newStrings, targetLanguage) {
  const translations = {};
  const entries = Object.entries(newStrings);

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < entries.length; i += CONCURRENT_BATCH_SIZE) {
    const batch = entries.slice(i, i + CONCURRENT_BATCH_SIZE);
    const promises = batch.map(([path, text]) =>
      retryTranslation(text, targetLanguage, path)
    );

    const results = await Promise.allSettled(promises);

    // Handle results
    results.forEach((result, index) => {
      const [path] = batch[index];
      if (result.status === "fulfilled") {
        translations[path] = result.value;
        console.log(`Translated: ${newStrings[path]} -> ${result.value}`);
      } else {
        console.error(
          `Failed to translate ${path} after all retries:`,
          result.reason
        );
      }
    });

    // Add small delay between batches
    if (i + CONCURRENT_BATCH_SIZE < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return translations;
}

async function retryTranslation(text, targetLanguage, path, attempt = 1) {
  try {
    return await translateText(text, targetLanguage);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(
        `Retrying translation for "${path}" after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryTranslation(text, targetLanguage, path, attempt + 1);
    }
    throw error;
  }
}

// Add this new constant for parallel language processing
const CONCURRENT_LANGUAGES = 10; // Process 5 languages at a time

// Modify the main function to process languages in parallel
async function main() {
  try {
    const sourceFile = await fs.readFile(
      path.join(__dirname, "../messages/en.json"),
      "utf8"
    );
    const sourceData = JSON.parse(sourceFile);

    // Process languages in batches
    for (let i = 0; i < TARGET_LANGUAGES.length; i += CONCURRENT_LANGUAGES) {
      const languageBatch = TARGET_LANGUAGES.slice(i, i + CONCURRENT_LANGUAGES);

      const promises = languageBatch.map(async (language) => {
        const langCode = LANGUAGE_TO_CODE[language];
        console.log(`\nProcessing ${language}...`);

        // Load existing translation
        const existingTranslation = await loadExistingTranslation(langCode);

        // Find new strings
        const newStrings = findNewStrings(sourceData, existingTranslation);

        if (Object.keys(newStrings).length === 0) {
          console.log(`No new strings to translate for ${language}`);
          return;
        }

        console.log(
          `Found ${Object.keys(newStrings).length} new strings to translate for ${language}`
        );

        // Translate new strings
        const translations = await translateNewStrings(newStrings, language);

        // Merge new translations with existing ones
        const updatedTranslation = { ...existingTranslation };
        for (const [path, translation] of Object.entries(translations)) {
          setNestedValue(updatedTranslation, path, translation);
        }

        // Write updated translation file
        const outputPath = path.join(__dirname, `../messages/${langCode}.json`);
        await fs.writeFile(
          outputPath,
          JSON.stringify(updatedTranslation, null, 2),
          "utf8"
        );

        console.log(`✅ Updated ${langCode}.json`);
      });

      // Wait for current batch of languages to complete
      await Promise.all(promises);

      // Add delay between language batches to avoid rate limiting
      if (i + CONCURRENT_LANGUAGES < TARGET_LANGUAGES.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("\nTranslation process completed successfully!");
  } catch (error) {
    console.error("Translation failed:", error);
  }
}

main();
