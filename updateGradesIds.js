import { readFileSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Update the path to point to db.json in the same directory
const dbPath = join(__dirname, 'db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8'));

// Add unique IDs to all grades
db.grades = db.grades.map(grade => ({
  id: uuidv4(),
  ID: grade.ID,
  subjectID: grade.subjectID,
  homework: grade.homework || '',
  assignment: grade.assignment || '',
  groupDiscussion: grade.groupDiscussion || '',
  project: grade.project || '',
  totalScore: grade.totalScore || '',
  grade: grade.grade || ''
}));

// Write the updated data back to db.json
writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('Successfully updated grades with unique IDs'); 