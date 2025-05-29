# Sanity Bulk AI Translate

A utility script for automating bulk translations of specific fields in Sanity CMS documents using the Sanity AI Assist Plugin and the sanity-plugin-internationalized-array plugin.

## Features

- Field-level translation support for internationalized array structures
- Bulk translate specific fields from one language to another using Sanity's AI translation capabilities
- Configurable content types and field mappings
- Support for sanity-plugin-internationalized-array plugin format
- Automatic publishing of translated documents
- Error logging and tracking of failed translations for retry
- Individual field translation with granular error reporting

## Supported Document Types and Fields

- **Courses**: `title`, `duration`, `description`
- **Authors**: `role`, `seoTitle`, `seoDescription`
- **Dimensions**: `title`, `subtitle`, `description`

## Field Structure

This script works with internationalized arrays as used by the sanity-plugin-internationalized-array plugin:

```javascript
{
  title: [
    { _key: "en", value: "English title" },
    { _key: "fr", value: "French title" }
  ]
}
```

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   SANITY_PROJECT_ID=your_project_id
   SANITY_DATASET=your_dataset_name
   SANITY_AUTH_TOKEN=your_auth_token
   SANITY_USER_ID=your_user_id (optional)
   TRANSLATION_STYLEGUIDE=your_styleguide (optional)
   ```

## Usage

1. Update the `SOURCE_LANGUAGE` and `TARGET_LANGUAGE` constants in the script
2. Configure the `CONTENT_TYPES` array to match your Sanity content model and the specific fields you want to translate
3. Run the script:
   ```
   node sanity-translate.cjs
   ```

## Field-Level Translation

The script processes each field individually for each document:
- Checks if the target language is missing for each field
- Translates each field separately using the Sanity AI Assist API
- Provides detailed logging for each field translation
- Only publishes the document after all fields are successfully translated

## Output

The script will generate log files for each content type processed and a summary of the translation job. Failed translations will be saved to `failed_translations.json` for retry.

Each log entry shows the status of individual field translations:
```
Document abc123: SUCCESS - Fields: title:OK, duration:OK, description:OK
Document def456: PARTIAL/FAILED - Fields: title:OK, duration:FAIL, description:OK
```
