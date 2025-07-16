// Test automatisé de compatibilité SOFIA Extension
// Ce script vérifie que toutes les fonctionnalités sont correctement intégrées

console.log('🚀 SOFIA Extension - Tests de compatibilité');
console.log('═'.repeat(50));

// Test 1: Vérifier que le build contient tous les fichiers nécessaires
console.log('📦 Test 1: Vérification du build');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build/chrome-mv3-prod');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'static/background/index.js',
  'tracking.7197568a.js' // Content script
];

let buildTestPassed = true;
requiredFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Présent`);
  } else {
    console.log(`❌ ${file} - Manquant`);
    buildTestPassed = false;
  }
});

// Test 2: Vérifier le manifest
console.log('\n📋 Test 2: Vérification du manifest');
const manifestPath = path.join(buildDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Vérifier les permissions
  const requiredPermissions = ['storage', 'history', 'tabs', 'activeTab', 'alarms'];
  const manifestPermissions = manifest.permissions || [];
  
  console.log('Permissions requises vs présentes:');
  requiredPermissions.forEach(perm => {
    if (manifestPermissions.includes(perm)) {
      console.log(`✅ ${perm} - Présent`);
    } else {
      console.log(`❌ ${perm} - Manquant`);
      buildTestPassed = false;
    }
  });
  
  // Vérifier les host permissions
  if (manifest.host_permissions && manifest.host_permissions.includes('<all_urls>')) {
    console.log('✅ host_permissions - Configuré pour <all_urls>');
  } else {
    console.log('❌ host_permissions - Manquant ou incorrect');
    buildTestPassed = false;
  }
  
  // Vérifier le content script
  if (manifest.content_scripts && manifest.content_scripts.length > 0) {
    const contentScript = manifest.content_scripts[0];
    if (contentScript.matches && contentScript.matches.includes('<all_urls>')) {
      console.log('✅ content_scripts - Configuré pour <all_urls>');
    } else {
      console.log('❌ content_scripts - Matches incorrect');
      buildTestPassed = false;
    }
  } else {
    console.log('❌ content_scripts - Manquant');
    buildTestPassed = false;
  }
} else {
  console.log('❌ manifest.json - Fichier manquant');
  buildTestPassed = false;
}

// Test 3: Vérifier la structure des fichiers source
console.log('\n📁 Test 3: Vérification de la structure des fichiers');
const sourceFiles = [
  'types/index.ts',
  'types/history.ts',
  'types/messaging.ts',
  'types/storage.ts',
  'types/wallet.ts',
  'lib/history.ts',
  'background/index.ts',
  'contents/tracking.ts',
  'components/tracking/TrackingStatus.tsx',
  'components/tracking/TrackingStats.tsx',
  'components/tracking/TrackingActions.tsx',
  'components/tracking/RecentVisits.tsx',
  'components/THP_WalletConnectionButton.tsx',
  'hooks/useTracking.ts',
  'popup.tsx'
];

let sourceTestPassed = true;
sourceFiles.forEach(file => {
  const filePath = path.join(__dirname, '../', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Présent`);
  } else {
    console.log(`❌ ${file} - Manquant`);
    sourceTestPassed = false;
  }
});

// Test 4: Vérifier les dépendances package.json
console.log('\n📦 Test 4: Vérification des dépendances');
const packagePath = path.join(__dirname, '../package.json');
let depsTestPassed = true;

if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    '@plasmohq/storage',
    'lucide-react',
    'plasmo',
    'react',
    'react-dom'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - Installé`);
    } else {
      console.log(`❌ ${dep} - Manquant`);
      depsTestPassed = false;
    }
  });
} else {
  console.log('❌ package.json - Fichier manquant');
  depsTestPassed = false;
}

// Résumé des tests
console.log('\n🏁 Résumé des tests');
console.log('═'.repeat(50));
console.log(`📦 Build: ${buildTestPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
console.log(`📁 Structure: ${sourceTestPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
console.log(`📋 Dépendances: ${depsTestPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

const allTestsPassed = buildTestPassed && sourceTestPassed && depsTestPassed;
console.log(`\n🎯 Résultat global: ${allTestsPassed ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`);

if (allTestsPassed) {
  console.log('\n🚀 L\'extension est prête pour le test manuel!');
  console.log('📋 Suivez les instructions dans test/compatibility-test.md');
  console.log('🔧 Chargez build/chrome-mv3-prod dans Chrome Extensions');
} else {
  console.log('\n❌ Corrigez les erreurs avant de tester l\'extension');
}

process.exit(allTestsPassed ? 0 : 1);