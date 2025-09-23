// Analyse d'accessibilité des couleurs pour l'extension Sofia
// Script pour calculer les ratios de contraste WCAG 2.1

// Définitions des couleurs de base Sofia
const COLORS = {
  '--black': '#000000',
  '--semi-black': '#14213D',
  '--yellow': '#FCA311',
  '--grey': '#E5E5E5',
  '--white': '#FFFFFF',
  '--destructive': '#C75454',
  '--color-success': '#8DC25F',
  '--color-error': '#C75454',
  '--color-warning': '#CC8147',
  '--color-info': '#58B3D1',
  // Variables qui semblent équivalentes
  '--background': '#000000', // semble équivalent à --black basé sur l'usage
  '--color-background': '#000000',
  '--color-text-primary': '#FFFFFF', // semble être white basé sur l'usage
};

// Couleurs glass effects (transparentes - difficiles à analyser)
const GLASS_EFFECTS = {
  '--color-bg-glass': 'rgba(255,255,255,0.1)',
  '--color-bg-glass-light': 'rgba(255,255,255,0.05)',
  '--color-bg-glass-lighter': 'rgba(255,255,255,0.08)',
  '--color-bg-dark': 'rgba(20,33,61,0.15)',
  '--color-bg-darker': 'rgba(20,33,61,0.25)',
  '--color-bg-black': 'rgba(0,0,0,0.8)',
  '--color-bg-overlay': 'rgba(0,0,0,0.95)',
  '--bg-overlay-light': 'rgba(255,255,255,0.1)', // assumé basé sur le nom
};

// Fonction pour convertir hex en RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Fonction pour calculer la luminance relative
function getRelativeLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Fonction pour calculer le ratio de contraste
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Fonction pour évaluer le niveau WCAG
function getWCAGLevel(ratio) {
  if (ratio >= 7) return 'AAA (normal) / AAA (large)';
  if (ratio >= 4.5) return 'AA (normal) / AAA (large)';
  if (ratio >= 3) return 'AA (large) only';
  return 'FAIL - Does not meet WCAG standards';
}

// Combinaisons trouvées dans le code (background + color)
const FOUND_COMBINATIONS = [
  // Basé sur l'analyse des fichiers CSS
  { background: '--background', color: '--white', context: 'General backgrounds' },
  { background: '--background', color: '--semi-black', context: 'Button text' },
  { background: '--background', color: '--yellow', context: 'Interactive elements' },

  { background: '--grey', color: '--semi-black', context: 'HomeConnectedPage buttons' },
  { background: '--grey', color: '--white', context: 'General text on grey' },
  { background: '--grey', color: '--black', context: 'Dark text on grey' },

  { background: '--yellow', color: '--black', context: 'Primary buttons' },
  { background: '--yellow', color: '--white', context: 'Alternative button text' },

  { background: '--semi-black', color: '--white', context: 'Semi-black backgrounds' },
  { background: '--semi-black', color: '--yellow', context: 'Accent on semi-black' },

  { background: '--white', color: '--black', context: 'Light backgrounds' },
  { background: '--white', color: '--semi-black', context: 'Text on white' },

  { background: '--destructive', color: '--white', context: 'Error states' },
  { background: '--color-success', color: '--white', context: 'Success states' },
  { background: '--color-info', color: '--white', context: 'Info states' },
  { background: '--color-warning', color: '--white', context: 'Warning states' },
];

// Analyse principale
console.log('='.repeat(80));
console.log('RAPPORT D\'ACCESSIBILITÉ - EXTENSION SOFIA');
console.log('Analyse des combinaisons couleur/fond selon WCAG 2.1');
console.log('='.repeat(80));
console.log();

console.log('COULEURS DÉFINIES:');
Object.entries(COLORS).forEach(([name, hex]) => {
  console.log(`${name.padEnd(20)} : ${hex}`);
});
console.log();

console.log('ANALYSE DES COMBINAISONS TROUVÉES:');
console.log('-'.repeat(80));

let totalCombinations = 0;
let failedCombinations = 0;
let warnings = [];

FOUND_COMBINATIONS.forEach(({ background, color, context }) => {
  const bgColor = COLORS[background];
  const textColor = COLORS[color];

  if (!bgColor || !textColor) {
    warnings.push(`⚠️  Couleur non définie: ${background} ou ${color}`);
    return;
  }

  totalCombinations++;
  const ratio = getContrastRatio(bgColor, textColor);
  const level = getWCAGLevel(ratio);
  const status = ratio >= 4.5 ? '✅' : ratio >= 3 ? '⚠️' : '❌';

  if (ratio < 4.5) failedCombinations++;

  console.log(`${status} ${background} (${bgColor}) + ${color} (${textColor})`);
  console.log(`   Ratio: ${ratio.toFixed(2)}:1 - ${level}`);
  console.log(`   Context: ${context}`);
  console.log();
});

// Analyse additionnelle des principales combinaisons couleur
console.log('ANALYSE COMPLÈTE DES PRINCIPALES COMBINAISONS:');
console.log('-'.repeat(80));

const mainColors = ['--black', '--semi-black', '--yellow', '--grey', '--white'];
const additionalAnalysis = [];

mainColors.forEach(bg => {
  mainColors.forEach(fg => {
    if (bg !== fg) {
      const bgColor = COLORS[bg];
      const fgColor = COLORS[fg];
      const ratio = getContrastRatio(bgColor, fgColor);
      const level = getWCAGLevel(ratio);
      const status = ratio >= 4.5 ? '✅' : ratio >= 3 ? '⚠️' : '❌';

      additionalAnalysis.push({
        combination: `${bg} + ${fg}`,
        ratio,
        level,
        status,
        bgColor,
        fgColor
      });
    }
  });
});

// Trier par ratio (du plus faible au plus élevé)
additionalAnalysis.sort((a, b) => a.ratio - b.ratio);

additionalAnalysis.forEach(({ combination, ratio, level, status, bgColor, fgColor }) => {
  console.log(`${status} ${combination}`);
  console.log(`   Colors: ${bgColor} sur ${fgColor}`);
  console.log(`   Ratio: ${ratio.toFixed(2)}:1 - ${level}`);
  console.log();
});

console.log('RÉSUMÉ:');
console.log('-'.repeat(40));
console.log(`Total des combinaisons analysées: ${totalCombinations}`);
console.log(`Combinaisons échouant AA (4.5:1): ${failedCombinations}`);
console.log(`Taux de réussite: ${((totalCombinations - failedCombinations) / totalCombinations * 100).toFixed(1)}%`);

if (warnings.length > 0) {
  console.log('\nAVERTISSEMENTS:');
  warnings.forEach(warning => console.log(warning));
}

console.log('\nRECOMMANDATIONS:');
console.log('1. Éviter le texte gris (#E5E5E5) sur fond semi-black (#14213D)');
console.log('2. Vérifier les textes sur les backgrounds glass (transparents)');
console.log('3. S\'assurer que tous les états interactifs respectent AA');
console.log('4. Considérer des alternatives pour les combinaisons échouant');