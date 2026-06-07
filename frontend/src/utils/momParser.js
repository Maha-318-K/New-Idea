export const parseMomNotes = (notes) => {
  if (!notes) return [];

  // Normalize escaped dots like "2\." to "2." and "**" to ""
  const normalizedNotes = notes.replace(/\\?\./g, '.').replace(/\*\*/g, '');
  const lines = normalizedNotes.split('\n');
  
  const points = [];
  let currentPoint = null;
  
  // A regex to match the start of a point: "1.", "1. ", "12."
  const pointStartRegex = /^(\d+)\.\s*(.*)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(pointStartRegex);
    if (match) {
      if (currentPoint) {
        points.push(currentPoint);
      }
      currentPoint = {
        title: match[2],
        details: []
      };
    } else if (currentPoint) {
      currentPoint.details.push(line);
    }
  }
  if (currentPoint) {
    points.push(currentPoint);
  }
  
  return points.map((p, index) => {
    let pageName = '-';
    let issueText = p.title;
    
    // Pattern: Title has a dash, e.g. "Company Profile - Date Format"
    if (p.title.includes('-') || p.title.includes('–')) {
      const parts = p.title.split(/[-–]/);
      pageName = parts[0].trim();
      issueText = parts.slice(1).join('-').trim();
    } else {
      // Pattern: "In the [Page Name] page, [issue]"
      let match = issueText.match(/^In the (.+?)\s*(?:page|module),?\s*(.*)$/i);
      if (match) {
        pageName = match[1].trim();
        issueText = match[2].trim();
      } else {
        // Pattern: "While [doing something], [issue]"
        match = issueText.match(/^While (.+?),\s*(.*)$/i);
        if (match) {
          pageName = match[1].trim();
          issueText = match[2].trim();
        } else {
          // Pattern: "Page X - Y"
          match = issueText.match(/^(?:page|screen)\s*([^:-]+)[:-]?\s*(.*)$/i);
          if (match) {
            pageName = match[1].trim();
            issueText = match[2].trim();
          }
        }
      }
    }
    
    // Append multiline details
    if (p.details.length > 0) {
      issueText += (issueText ? '\n' : '') + p.details.join('\n');
    }
    
    if (pageName.toLowerCase().endsWith(' page')) {
      pageName = pageName.substring(0, pageName.length - 5);
    }
    
    if (pageName !== '-') {
      pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }
    
    return {
      index: index + 1,
      pageName,
      issueText
    };
  });
};
