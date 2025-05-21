# Sanity Bulk AI Translate

A utility script for automating bulk translations of documents in Sanity CMS using the Sanity AI Assist Plugin.

## Features

- Bulk translate documents from one language to another using Sanity's AI translation capabilities
- Configurable content types and language settings
- Automatic publishing of translated documents
- Error logging and tracking of failed translations for retry

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
2. Configure the `CONTENT_TYPES` array to match your Sanity content model
3. Run the script:
   ```
   node sanity-translate.js
   ```

## Output

The script will generate log files for each content type processed and a summary of the translation job. Failed translations will be saved to `failed_translations.json` for retry.
