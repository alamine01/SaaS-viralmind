function parseSubs(subText) {
  let followers = 0;
  if (subText) {
    const subLower = subText.toLowerCase();
    const numMatch = subLower.match(/([0-9,.\s ]+)/);
    if (numMatch) {
      // 1. Enlever d'abord tous les types d'espaces (y compris insécables \u00a0)
      let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
      
      // 2. Traiter la virgule de façon intelligente
      if (cleanNum.includes(',')) {
        const parts = cleanNum.split(',');
        // Si les chiffres après la virgule sont inférieurs à 3, c'est une décimale (ex: 2,32 M ou 1,5 k)
        if (parts[1].length < 3) {
          cleanNum = cleanNum.replace(',', '.');
        } else {
          // Sinon c'est un séparateur de milliers (ex: 158,000)
          cleanNum = cleanNum.replace(',', '');
        }
      }
      
      let val = parseFloat(cleanNum);
      if (subLower.includes('k') || subLower.includes('mille')) {
        followers = val * 1000;
      } else if (subLower.includes('m') || subLower.includes('million')) {
        followers = val * 1000000;
      } else {
        followers = val;
      }
    }
  }
  return followers;
}

console.log("=== VÉRIFICATION DU NOUVEAU PARSER DE DÉCIMALES ===");
const testCases = [
  { text: "158 k abonnés", expected: 158000 },
  { text: "2,32 millions d'abonnés", expected: 2320000 },
  { text: "1,5 M d'abonnés", expected: 1500000 },
  { text: "185,000 subscribers", expected: 185000 },
  { text: "350 abonnés", expected: 350 }
];

testCases.forEach((tc) => {
  const result = parseSubs(tc.text);
  console.log(`Input: "${tc.text}" | Parsed: ${result.toLocaleString()} | Expected: ${tc.expected.toLocaleString()} | Status: ${result === tc.expected ? "✅ OK" : "❌ FAUX"}`);
});
