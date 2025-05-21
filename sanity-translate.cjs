// sanity-translate.js
// A script to bulk translate documents in Sanity CMS using the Sanity AI Assist Plugin

const { createClient } = require("@sanity/client")
const dotenv = require("dotenv")
const fs = require("fs")

// Load environment variables from .env file
dotenv.config()

// Initialize Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_AUTH_TOKEN, // needs write access
  apiVersion: "2025-04-08", // use current date in YYYY-MM-DD format
  useCdn: false, // We need the latest content, not cached
})

// Configuration
const SOURCE_LANGUAGE = "en" // Source language code
const TARGET_LANGUAGE = "fr" // Target language code - change as needed
const USER_ID = process.env.SANITY_USER_ID || "" // Your Sanity user ID (optional)
const STYLEGUIDE = process.env.TRANSLATION_STYLEGUIDE || "" // Any translation styleguide you want to use

// Define the content types to process - these are your document types
const CONTENT_TYPES = [
  { type: "resource", count: 21 },
  { type: "section", count: 36 },
  { type: "button", count: 61 },
  { type: "events", count: 21 },
  { type: "footerGuide", count: 3 },
  { type: "lesson", count: 857 },
  { type: "menuItems", count: 53 },
  { type: "settings", count: 4 },
  { type: "dimension", count: 20 },
  { type: "module", count: 5 },
  { type: "testimonial", count: 12 },
  { type: "additionalResources", count: 82 },
  { type: "assessmentReport", count: 2 },
  { type: "course", count: 88 },
  { type: "form", count: 17 },
  { type: "menu", count: 23 },
  { type: "page", count: 53 },
  { type: "statement", count: 132 },
  { type: "author", count: 22 },
  { type: "collection", count: 15 },
  { type: "contentCard", count: 60 },
  { type: "dimensionGroup", count: 6 },
]

// Note: We're not explicitly setting fieldLanguageMap as it appears
// to be handled internally by the Sanity AI Assist plugin based on your code

// Fetch schema information
async function fetchSchema() {
  try {
    // This is a simplified approach - in a real scenario you might want to
    // use Sanity's schema APIs to get the full schema
    const test = await client.datasets.list()
    console.log("Schema fetched successfully.", test)
    const schemaResponse = await client.request({
      url: `/projects/${process.env.SANITY_PROJECT_ID}/datasets/${process.env.SANITY_DATASET}`,
      method: "GET",
    })
    console.log("Schema fetched successfully.", schemaResponse)
    return schemaResponse
  } catch (error) {
    console.error("Error fetching schema:", error.message)
    // Return a minimal schema representation if we can't fetch the real one
    return {
      types: CONTENT_TYPES.map((ct) => ({ name: ct.type, type: "document" })),
    }
  }
}

// Function to translate document using Sanity AI Assist
async function translateDocument(documentId, schema) {
  try {
    console.log(`Translating document ${documentId}...`)

    // Construct the API request based on your code
    const apiUrl = `/assist/tasks/translate/${process.env.SANITY_DATASET}?projectId=${process.env.SANITY_PROJECT_ID}`

    // We're matching the exact parameters used in your UI code
    const response = await client.request({
      method: "POST",
      url: apiUrl,
      body: {
        documentId,
        types: schema,
        languagePath: SOURCE_LANGUAGE, // Source language
        userStyleguide: STYLEGUIDE, // Any translation styleguide
        translatePath: "", // Empty means translate the whole document
        userId: USER_ID,
        conditionalMembers: [], // We don't have form state to get these
      },
    })

    return {
      success: true,
      response,
    }
  } catch (error) {
    console.error(
      `Translation error for document ${documentId}:`,
      error.message
    )
    if (error.response) {
      console.error(`Response status: ${error.response.status}`)
      console.error(`Response data:`, error.response.data)
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to fetch documents of a specific type
async function fetchDocuments(type) {
  try {
    // This query fetches documents of the specified type that have source language fields
    // but are missing at least one of the target language fields
    // Adjust this query based on your schema and translation needs
    const query = `*[_type == "${type}" && (
      defined(title) && (!defined(title_${TARGET_LANGUAGE}) || title_${TARGET_LANGUAGE} == "") ||
      defined(description) && (!defined(description_${TARGET_LANGUAGE}) || description_${TARGET_LANGUAGE} == "")
    )]`

    return await client.fetch(query)
  } catch (error) {
    console.error(`Error fetching ${type} documents: ${error.message}`)
    return []
  }
}

// Function to publish a document
async function publishDocument(documentId) {
  try {
    await client.patch(documentId).publish()
    console.log(`Published document ${documentId}`)
    return true
  } catch (error) {
    console.error(`Error publishing document ${documentId}: ${error.message}`)
    return false
  }
}

// Main function to process all content types
async function processAllContentTypes() {
  let totalProcessed = 0
  let totalSuccess = 0
  let failedDocuments = []

  console.log("Fetching schema information...")
  const schema = await fetchSchema()

  // Process each content type
  for (const contentType of CONTENT_TYPES) {
    console.log(
      `\nProcessing ${contentType.type} (estimated ${contentType.count} documents)...`
    )

    // Fetch documents of current type that need translation
    const documents = await fetchDocuments(contentType.type)
    console.log(`Found ${documents.length} documents to translate.`)

    // Create a log file for this content type
    fs.appendFileSync(
      `${contentType.type}_translation_log.txt`,
      `\n--- Translation started at ${new Date().toISOString()} ---\n`
    )

    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]
      console.log(
        `[${i + 1}/${documents.length}] Processing document ${document._id}...`
      )

      // Translate the document
      //   const translationResult = await translateDocument(document._id, schema)
      const translationResult = {
        success: true,
      }

      // Log the result
      const logEntry = `Document ${document._id}: ${
        translationResult.success
          ? "SUCCESS"
          : "FAILED - " + translationResult.error
      }\n`
      fs.appendFileSync(`${contentType.type}_translation_log.txt`, logEntry)

      if (translationResult.success) {
        // Wait a moment for the translation to be processed
        console.log(`Waiting for translation to complete...`)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Publish the document
        // const publishSuccess = await publishDocument(document._id)
        const publishSuccess = true // Simulate successful publish

        if (publishSuccess) {
          totalSuccess++
        } else {
          failedDocuments.push({
            id: document._id,
            type: contentType.type,
            reason: "Failed to publish",
          })
        }
      } else {
        failedDocuments.push({
          id: document._id,
          type: contentType.type,
          reason: translationResult.error,
        })
      }

      totalProcessed++

      // Add a delay between documents to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Log the overall results
  console.log(`\n=== Translation Summary ===`)
  console.log(`Total documents processed: ${totalProcessed}`)
  console.log(`Successfully translated and published: ${totalSuccess}`)
  console.log(`Failed documents: ${failedDocuments.length}`)

  // Save failed documents to a file for retry
  if (failedDocuments.length > 0) {
    fs.writeFileSync(
      "failed_translations.json",
      JSON.stringify(failedDocuments, null, 2)
    )
    console.log(`Details of failed documents saved to failed_translations.json`)
  }
}

// Execute the main function
console.log("Starting translation process...")
processAllContentTypes()
  .then(() => console.log("Translation job complete!"))
  .catch((error) => console.error(`Error in main process: ${error.message}`))

/*
Usage instructions:
1. Install dependencies: npm install @sanity/client axios dotenv fs
2. Create a .env file with:
   SANITY_PROJECT_ID=your_project_id
   SANITY_DATASET=your_dataset_name  
   SANITY_AUTH_TOKEN=your_auth_token
   SANITY_USER_ID=your_user_id (optional)
   TRANSLATION_STYLEGUIDE=your_styleguide (optional)
3. Update the SOURCE_LANGUAGE and TARGET_LANGUAGE constants
4. Update the CONTENT_TYPES array to match your content model
5. Run: node sanity-translate.js
*/
