const fs = require('fs');
const path = require('path');

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, filter, fileList);
    } else if (filter.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findFiles('src', /\.(jsx|js)$/);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if it doesn't have DatePicker
  if (!content.includes('<DatePicker')) continue;
  
  let originalContent = content;
  
  // First, remove existing props to avoid duplication
  content = content.replace(/\bshowMonthDropdown\b/g, '');
  content = content.replace(/\bshowYearDropdown\b/g, '');
  content = content.replace(/\bdropdownMode=(["'])select\1/g, '');
  
  // Clean up any double spaces left behind
  content = content.replace(/\s{2,}/g, (match) => {
    // only replace inside tags ideally, but doing it globally for spaces next to each other is fine
    // wait, replacing multiple spaces globally might break formatting. Let's not do that globally.
    return match;
  });

  // Now add the props right after <DatePicker
  content = content.replace(/<DatePicker/g, '<DatePicker showMonthDropdown showYearDropdown dropdownMode="select"');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
console.log('Done.');
