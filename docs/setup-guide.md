# Setup Guide

> This guide explains how to install, configure, run, and test PharmaGuard AI.

## Prerequisites

Before you begin, ensure you have the following installed:

- Git
- Node.js
- Python 3.x
  
 ## Environment Variables

PharmaGuard AI uses IBM watsonx.ai for AI functionality.

Create a `.env` file in the project root and add the required IBM watsonx.ai credentials provided by the developers.
## Installation
### Frontend

```bash
cd src/frontend
npm install

### Backend

```bash
cd src/backend
pip install -r requirements.txt

## Running the Application

### Frontend

```bash
cd src/frontend
npm run dev

### Backend

```bash
cd src/backend
python -m uvicorn main:app --reload

## Running Tests

The project can be tested by starting both the frontend and backend and verifying that they run without errors.

## Quick Demo

1. Start the frontend and backend using the commands above.
2. Open the frontend in your browser.
3. Use the Safety Intelligence and Regulatory Intelligence features to explore the application.
localhost : 

## Troubleshooting


| Issue                   | Solution                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `npm install` fails     | Check that Node.js is installed and try running the command again.                       |
| Python dependency error | Check that Python is installed and run `pip install -r requirements.txt` again.          |
| Backend does not start  | Make sure you are inside `src/backend` and run the Uvicorn command again.                |
| Frontend does not start | Make sure you are inside `src/frontend` and run `npm install` followed by `npm run dev`. |


| Frontend does not start | Make sure you are inside `src/frontend` and run `npm install` followed by `npm run dev`. |
