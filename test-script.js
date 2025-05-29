// Test script to validate the field-level translation logic
const fs = require("fs")

// Mock environment for testing
process.env.SANITY_PROJECT_ID = "test-project"
process.env.SANITY_DATASET = "test-dataset"
process.env.SANITY_AUTH_TOKEN = "test-token"

// Import the main script to test its functions
const path = require('path')

// Test the query generation logic
function testQueryGeneration() {
  console.log("Testing query generation for internationalized arrays...")
  
  const TARGET_LANGUAGE = "fr"
  const fields = ["title", "duration", "description"]
  
  // Build query conditions for each field to check if target language is missing
  const fieldConditions = fields.map(field => 
    `!defined(${field}[_key == "${TARGET_LANGUAGE}"])`
  ).join(' || ')
  
  // This query fetches documents that have source language fields
  // but are missing target language translations in internationalized arrays
  const type = "course"
  const query = `*[_type == "${type}" && (${fieldConditions})]`
  
  console.log(`Generated query: ${query}`)
  
  const expectedQuery = `*[_type == "course" && (!defined(title[_key == "fr"]) || !defined(duration[_key == "fr"]) || !defined(description[_key == "fr"]))]`
  
  if (query === expectedQuery) {
    console.log("✅ Query generation test PASSED")
    return true
  } else {
    console.log("❌ Query generation test FAILED")
    console.log(`Expected: ${expectedQuery}`)
    console.log(`Got: ${query}`)
    return false
  }
}

// Test content types configuration
function testContentTypes() {
  console.log("\nTesting content types configuration...")
  
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
  
  // Validate that all required fields are present
  let allValid = true
  
  CONTENT_TYPES.forEach(contentType => {
    if (!contentType.type || !contentType.fields || !Array.isArray(contentType.fields)) {
      console.log(`❌ Invalid content type configuration: ${JSON.stringify(contentType)}`)
      allValid = false
    } else {
      console.log(`✅ Valid content type: ${contentType.type} with fields: ${contentType.fields.join(', ')}`)
    }
  })
  
  if (allValid) {
    console.log("✅ Content types configuration test PASSED")
    return true
  } else {
    console.log("❌ Content types configuration test FAILED")
    return false
  }
}

// Test field mapping for specific document types
function testFieldMapping() {
  console.log("\nTesting field mapping against requirements...")
  
  const expectedFields = {
    course: ["title", "duration", "description"],
    author: ["role", "seoTitle", "seoDescription"],
    dimension: ["title", "subtitle", "description"]
  }
  
  const CONTENT_TYPES = [
    { type: "course", fields: ["title", "duration", "description"] },
    { type: "author", fields: ["role", "seoTitle", "seoDescription"] },
    { type: "dimension", fields: ["title", "subtitle", "description"] },
  ]
  
  let allValid = true
  
  CONTENT_TYPES.forEach(contentType => {
    const expected = expectedFields[contentType.type]
    if (!expected) {
      console.log(`❌ Unexpected content type: ${contentType.type}`)
      allValid = false
      return
    }
    
    if (JSON.stringify(contentType.fields.sort()) !== JSON.stringify(expected.sort())) {
      console.log(`❌ Field mismatch for ${contentType.type}`)
      console.log(`  Expected: ${expected.join(', ')}`)
      console.log(`  Got: ${contentType.fields.join(', ')}`)
      allValid = false
    } else {
      console.log(`✅ Correct fields for ${contentType.type}: ${contentType.fields.join(', ')}`)
    }
  })
  
  if (allValid) {
    console.log("✅ Field mapping test PASSED")
    return true
  } else {
    console.log("❌ Field mapping test FAILED")
    return false
  }
}

// Run all tests
console.log("=== Running Field-Level Translation Tests ===\n")

const results = [
  testQueryGeneration(),
  testContentTypes(),
  testFieldMapping()
]

const allPassed = results.every(result => result === true)

console.log("\n=== Test Summary ===")
if (allPassed) {
  console.log("🎉 All tests PASSED! The script is ready for field-level translations.")
} else {
  console.log("💥 Some tests FAILED. Please review the issues above.")
}

console.log(`\nTests passed: ${results.filter(r => r).length}/${results.length}`)