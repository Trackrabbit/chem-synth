import fs from 'fs';
import path from 'path';

const PUBCHEM_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";

function getDifficulty(z, symbol) {
  const easySymbols = ['H','C','N','O','Na','Mg','Al','Si','P','S','Cl','K','Ca','Fe','Cu','Zn','Ag','Au','Hg','Pb','I','Br'];
  if (z <= 20 || easySymbols.includes(symbol)) return "Easy";
  
  const intermediateSymbols = ['Sc','Ti','V','Cr','Mn','Co','Ni','As','Se','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Cd','Sb','Te','Xe','Cs','Ba','W','Pt','U'];
  if (intermediateSymbols.includes(symbol)) return "Intermediate";
  
  return "Hard";
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildMultipleChoice(prompt, correctAnswer, distractorPool, explanation, difficulty) {
  const filtered = distractorPool.filter(d => String(d) !== String(correctAnswer));
  const selectedDistractors = shuffle(filtered).slice(0, 3);
  
  // Failsafe in case distractor pool is too small
  while (selectedDistractors.length < 3) {
      selectedDistractors.push(`Invalid Option ${Math.random().toString().substring(2,5)}`);
  }
  
  const options = shuffle([correctAnswer, ...selectedDistractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    id: `q-${Math.random().toString(36).substring(2, 9)}`,
    prompt,
    options: options.map(String),
    correctIndex,
    explanation,
    difficulty
  };
}

// Map PubChem GroupBlocks to standard textbook categories
function normalizeGroup(block) {
    if (!block) return "Unknown";
    if (block.includes("Alkali metal")) return "Alkali Metal";
    if (block.includes("Alkaline earth metal")) return "Alkaline Earth Metal";
    if (block.includes("Halogen")) return "Halogen";
    if (block.includes("Noble gas")) return "Noble Gas";
    if (block.includes("Transition metal")) return "Transition Metal";
    if (block.includes("Lanthanide")) return "Lanthanide";
    if (block.includes("Actinide")) return "Actinide";
    if (block.includes("Metalloid")) return "Metalloid";
    if (block.includes("Nonmetal")) return "Nonmetal";
    if (block.includes("Post-transition metal")) return "Post-Transition Metal";
    return block;
}

async function generatePubChemQuizBank() {
  console.log("Synthesizing expanded periodic table data from PubChem...");
  
  try {
    const response = await fetch(PUBCHEM_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const rawData = await response.json();
    const columns = rawData.Table.Columns.Column;
    
    const colIdx = {
      z: columns.indexOf("AtomicNumber"),
      symbol: columns.indexOf("Symbol"),
      name: columns.indexOf("Name"),
      mass: columns.indexOf("AtomicMass"),
      state: columns.indexOf("StandardState"),
      group: columns.indexOf("GroupBlock"),
      en: columns.indexOf("Electronegativity")
    };
    
    const elements = rawData.Table.Row.map(row => ({
      z: parseInt(row.Cell[colIdx.z], 10),
      symbol: row.Cell[colIdx.symbol],
      name: row.Cell[colIdx.name],
      mass: parseFloat(row.Cell[colIdx.mass]) || Math.round(row.Cell[colIdx.mass]),
      state: row.Cell[colIdx.state] || "Unknown",
      group: normalizeGroup(row.Cell[colIdx.group]),
      en: parseFloat(row.Cell[colIdx.en]) || null,
      isMetal: String(row.Cell[colIdx.group]).toLowerCase().includes("metal") && !String(row.Cell[colIdx.group]).toLowerCase().includes("nonmetal")
    }));

    const quizBank = {
      "Element Names & Symbols": [],
      "Atomic Structure (Protons, Neutrons, Electrons)": [],
      "Periodic Trends & Classification": [],
      "Basic Chemical Bonding & Formulas": []
    };

    const allSymbols = elements.map(e => e.symbol);
    const allNames = elements.map(e => e.name);
    const allGroups = [...new Set(elements.map(e => e.group).filter(g => g !== "Unknown"))];
    const states = ["Solid", "Liquid", "Gas"];

    // 1. ITERATE ELEMENTS FOR DIRECT FACTS
    elements.forEach(el => {
      const difficulty = getDifficulty(el.z, el.symbol);

      // Names & Symbols
      quizBank["Element Names & Symbols"].push(
        buildMultipleChoice(`What is the elemental symbol for ${el.name}?`, el.symbol, allSymbols, `${el.name} has the atomic symbol ${el.symbol} (Z=${el.z}).`, difficulty),
        buildMultipleChoice(`Which element is represented by the symbol "${el.symbol}"?`, el.name, allNames, `The symbol ${el.symbol} represents ${el.name}.`, difficulty)
      );

      // Atomic Structure
      const roundedMass = Math.round(el.mass);
      const neutrons = roundedMass - el.z;
      
      if (neutrons > 0) {
        const numPool = [el.z, roundedMass, neutrons, el.z + 1, neutrons + 1, neutrons - 1, el.z + 2].filter(n => n > 0);
        quizBank["Atomic Structure (Protons, Neutrons, Electrons)"].push(
          buildMultipleChoice(`A neutral atom of ${el.name} (${el.symbol}) has an atomic mass of ~${roundedMass}. How many neutrons are in its nucleus?`, neutrons, numPool, `Neutrons = Atomic Mass (${roundedMass}) - Protons (${el.z}).`, difficulty)
        );
      }

      quizBank["Atomic Structure (Protons, Neutrons, Electrons)"].push(
        buildMultipleChoice(`How many protons are in a neutral atom of ${el.name} (${el.symbol})?`, el.z, [el.z + 1, el.z - 1, el.z + 2, el.z * 2, el.z], `Atomic number equals proton count (${el.z}).`, difficulty),
        buildMultipleChoice(`How many electrons orbit a neutral atom of ${el.name}?`, el.z, [el.z + 1, el.z - 1, el.z + 2, el.z * 2, el.z], `Neutral atoms have equal protons and electrons (${el.z}).`, difficulty)
      );

      // Classification & States (New Topic)
      if (el.group !== "Unknown") {
          quizBank["Periodic Trends & Classification"].push(
              buildMultipleChoice(`Which chemical group does ${el.name} belong to?`, el.group, allGroups, `${el.name} is classified as a ${el.group}.`, difficulty)
          );
      }
      
      if (el.state === "Solid" || el.state === "Liquid" || el.state === "Gas") {
          quizBank["Periodic Trends & Classification"].push(
              buildMultipleChoice(`At standard room temperature and pressure, what is the state of matter for ${el.name}?`, el.state, states, `${el.name} naturally occurs as a ${el.state.toLowerCase()}.`, difficulty)
          );
      }
    });

    // 2. GENERATE COMPARATIVE QUESTIONS (Mass & Electronegativity)
    for (let i = 0; i < 300; i++) {
        // Pick 4 random elements
        const selected = shuffle(elements).slice(0, 4);
        
        // Highest Mass
        const heaviest = selected.reduce((prev, curr) => (prev.mass > curr.mass) ? prev : curr);
        const difficultyHeaviest = selected.some(e => getDifficulty(e.z, e.symbol) === "Hard") ? "Hard" : "Intermediate";
        
        quizBank["Periodic Trends & Classification"].push(
            buildMultipleChoice(`Which of the following elements has the highest atomic mass?`, heaviest.name, selected.map(e => e.name), `${heaviest.name} has a mass of ${heaviest.mass} amu.`, difficultyHeaviest)
        );

        // Highest Electronegativity
        const enValid = selected.filter(e => e.en !== null);
        if (enValid.length === 4) {
            const mostEN = enValid.reduce((prev, curr) => (prev.en > curr.en) ? prev : curr);
            quizBank["Periodic Trends & Classification"].push(
                buildMultipleChoice(`Based on periodic trends, which of these elements is the most electronegative?`, mostEN.name, enValid.map(e => e.name), `Electronegativity increases up and to the right on the periodic table.`, "Intermediate")
            );
        }
    }

    // 3. GENERATE ALGORITHMIC BONDING QUESTIONS
    const metals = elements.filter(e => e.isMetal);
    const nonmetals = elements.filter(e => !e.isMetal && e.group !== "Noble Gas" && e.group !== "Unknown");
    const bondTypes = ["Ionic", "Covalent", "Metallic", "Hydrogen"];

    for (let i = 0; i < 300; i++) {
        // Generate Ionic pair (Metal + Nonmetal)
        const m = metals[Math.floor(Math.random() * metals.length)];
        const nm = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        const diffIonic = (getDifficulty(m.z, m.symbol) === "Hard" || getDifficulty(nm.z, nm.symbol) === "Hard") ? "Hard" : "Intermediate";
        
        quizBank["Basic Chemical Bonding & Formulas"].push(
            buildMultipleChoice(`If ${m.name} reacts with ${nm.name}, what primary type of bond will form?`, "Ionic", bondTypes, `A metal (${m.symbol}) and a nonmetal (${nm.symbol}) transfer electrons to form an ionic bond.`, diffIonic)
        );

        // Generate Covalent pair (Nonmetal + Nonmetal)
        const nm1 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        let nm2 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        while(nm1.symbol === nm2.symbol) nm2 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        
        quizBank["Basic Chemical Bonding & Formulas"].push(
            buildMultipleChoice(`What type of primary bond forms between ${nm1.name} and ${nm2.name}?`, "Covalent", bondTypes, `Two nonmetals (${nm1.symbol}, ${nm2.symbol}) share electrons to form a covalent bond.`, "Intermediate")
        );
    }

    const outDir = path.resolve('src', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    const targetFile = path.join(outDir, 'quizBank.json');
    fs.writeFileSync(targetFile, JSON.stringify(quizBank, null, 2));

    const counts = Object.fromEntries(Object.entries(quizBank).map(([k, v]) => [k, v.length]));
    console.log(`Success! Generated ${Object.values(quizBank).flat().length} questions.`);
    console.table(counts);

  } catch (error) {
    console.error("Failed to generate PubChem quiz bank:", error);
  }
}

generatePubChemQuizBank();