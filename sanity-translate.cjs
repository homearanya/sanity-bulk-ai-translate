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

// Define the content types to process with field-level translation support
// These types use the sanity-plugin-internationalized-array plugin
const CONTENT_TYPES = [
  { 
    type: "course", 
    count: 88,
    fields: ["title", "duration", "description"]
  },
  { 
    type: "author", 
    count: 22,
    fields: ["role", "seoTitle", "seoDescription"]
  },
  { 
    type: "dimension", 
    count: 20,
    fields: ["title", "subtitle", "description"]
  },
]

// Note: Using field-level translations with sanity-plugin-internationalized-array
// This means fields are stored as arrays like: [{ _key: "en", value: "English text" }, { _key: "fr", value: "French text" }]

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

// Function to translate specific fields of a document using Sanity AI Assist
async function translateDocument(documentId, schema, field) {
  try {
    console.log(`Translating field '${field}' for document ${documentId}...`)

    // Construct the API request for field-level translation
    const apiUrl = `/assist/tasks/translate/${process.env.SANITY_DATASET}?projectId=${process.env.SANITY_PROJECT_ID}`

    // For field-level translation, we specify the field path in translatePath
    const response = await client.request({
      method: "POST",
      url: apiUrl,
      body: {
        documentId,
        types: schema,
        languagePath: SOURCE_LANGUAGE, // Source language
        userStyleguide: STYLEGUIDE, // Any translation styleguide
        translatePath: field, // Specify the field to translate
        userId: USER_ID,
        conditionalMembers: [], // We don't have form state to get these
      },
    })

    return {
      success: true,
      response,
      field,
    }
  } catch (error) {
    console.error(
      `Translation error for field '${field}' in document ${documentId}:`,
      error.message
    )
    if (error.response) {
      console.error(`Response status: ${error.response.status}`)
      console.error(`Response data:`, error.response.data)
    }

    return {
      success: false,
      error: error.message,
      field,
    }
  }
}

// Function to fetch documents of a specific type that need translation
async function fetchDocuments(type, fields) {
  try {
    // Build query conditions for each field to check if target language is missing
    const fieldConditions = fields.map(field => 
      `!defined(${field}[_key == "${TARGET_LANGUAGE}"])`
    ).join(' || ')
    
    // This query fetches documents that have source language fields
    // but are missing target language translations in internationalized arrays
    const query = `*[_type == "${type}" && (${fieldConditions})]`
    
    console.log(`Query for ${type}: ${query}`)
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

// Main function to process all content types with field-level translations
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
    console.log(`Fields to translate: ${contentType.fields.join(', ')}`)

    // Fetch documents of current type that need translation
    const documents = await fetchDocuments(contentType.type, contentType.fields)
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

      let documentSuccess = true
      const fieldResults = []

      // Translate each field individually
      for (const field of contentType.fields) {
        console.log(`  Translating field: ${field}`)
        
        // Translate the specific field
        const translationResult = await translateDocument(document._id, schema, field)
        // For testing, comment out the above line and uncomment below:
        // const translationResult = { success: true, field }
        
        fieldResults.push(translationResult)
        
        if (!translationResult.success) {
          documentSuccess = false
          console.log(`    Field ${field}: FAILED - ${translationResult.error}`)
        } else {
          console.log(`    Field ${field}: SUCCESS`)
          // Wait a moment for the translation to be processed
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
        
        // Add a delay between field translations
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Log the overall result for this document
      const logEntry = `Document ${document._id}: ${
        documentSuccess ? "SUCCESS" : "PARTIAL/FAILED"
      } - Fields: ${fieldResults.map(r => `${r.field}:${r.success ? 'OK' : 'FAIL'}`).join(', ')}\n`
      fs.appendFileSync(`${contentType.type}_translation_log.txt`, logEntry)

      if (documentSuccess) {
        // Publish the document after all fields are translated
        const publishSuccess = await publishDocument(document._id)
        // For testing, comment out the above line and uncomment below:
        // const publishSuccess = true

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
          reason: "Field translation failures: " + fieldResults.filter(r => !r.success).map(r => r.field).join(', '),
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
Field-Level Translation Script for Sanity with internationalized-array plugin

This script translates specific fields in Sanity documents that use the 
sanity-plugin-internationalized-array plugin for localization.

Usage instructions:
1. Install dependencies: npm install @sanity/client dotenv
2. Create a .env file with:
   SANITY_PROJECT_ID=your_project_id
   SANITY_DATASET=your_dataset_name  
   SANITY_AUTH_TOKEN=your_auth_token
   SANITY_USER_ID=your_user_id (optional)
   TRANSLATION_STYLEGUIDE=your_styleguide (optional)
3. Update the SOURCE_LANGUAGE and TARGET_LANGUAGE constants
4. Update the CONTENT_TYPES array to match your content model and fields
5. Run: node sanity-translate.cjs

Document Types and Fields:
- course: title, duration, description
- author: role, seoTitle, seoDescription  
- dimension: title, subtitle, description

The script expects fields to be internationalized arrays like:
{
  title: [
    { _key: "en", value: "English title" },
    { _key: "fr", value: "French title" }
  ]
}
*/
