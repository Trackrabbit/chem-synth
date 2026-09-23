import fs from 'fs';
import path from 'path';

const PUBCHEM_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";

// Dictionary for elements with non-English/Latin-derived symbols
const ETYMOLOGY = {
  "Na": "Natrium",
  "K": "Kalium",
  "Fe": "Ferrum",
  "Cu": "Cuprum",
  "Ag": "Argentum",
  "Sn": "Stannum",
  "Sb": "Stibium",
  "W": "Wolfram",
  "Au": "Aurum",
  "Hg": "Hydrargyrum",
  "Pb": "Plumbum"
};

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
    const states = ["Solid", "Liquid", "Gas", "Plasma"];

    elements.forEach(el => {
      const difficulty = getDifficulty(el.z, el.symbol);
      
      // Inject Etymology if it exists
      const etymologyNote = ETYMOLOGY[el.symbol] 
        ? ` The symbol ${el.symbol} is derived from its historical name, ${ETYMOLOGY[el.symbol]}.` 
        : "";

      // Names & Symbols
      quizBank["Element Names & Symbols"].push(
        buildMultipleChoice(
            `What is the elemental symbol for ${el.name}?`, 
            el.symbol, 
            allSymbols, 
            `The elemental symbol for ${el.name} is ${el.symbol}. It is element number ${el.z} on the periodic table.${etymologyNote}`, 
            difficulty
        ),
        buildMultipleChoice(
            `Which element is represented by the symbol "${el.symbol}"?`, 
            el.name, 
            allNames, 
            `On the periodic table, the symbol ${el.symbol} specifically designates the element ${el.name} (Atomic Number: ${el.z}).${etymologyNote}`, 
            difficulty
        )
      );

      // Atomic Structure
      const roundedMass = Math.round(el.mass);
      const neutrons = roundedMass - el.z;
      
      if (neutrons > 0) {
        const numPool = [el.z, roundedMass, neutrons, el.z + 1, neutrons + 1, neutrons - 1, el.z + 2].filter(n => n > 0);
        quizBank["Atomic Structure (Protons, Neutrons, Electrons)"].push(
          buildMultipleChoice(
              `A neutral atom of ${el.name} (${el.symbol}) has an atomic mass of ~${roundedMass}. How many neutrons are in its nucleus?`, 
              neutrons, 
              numPool, 
              `To find the number of neutrons, subtract the atomic number (protons, ${el.z}) from the atomic mass (~${roundedMass}). ${roundedMass} - ${el.z} = ${neutrons} neutrons.`, 
              difficulty
          )
        );
      }

      quizBank["Atomic Structure (Protons, Neutrons, Electrons)"].push(
        buildMultipleChoice(
            `How many protons are in a neutral atom of ${el.name} (${el.symbol})?`, 
            el.z, 
            [el.z + 1, el.z - 1, el.z + 2, el.z * 2, el.z], 
            `An element's identity is defined by its atomic number, which is exactly equal to the number of protons in its nucleus. For ${el.name}, this is ${el.z}.`, 
            difficulty
        ),
        buildMultipleChoice(
            `How many electrons orbit a neutral atom of ${el.name}?`, 
            el.z, 
            [el.z + 1, el.z - 1, el.z + 2, el.z * 2, el.z], 
            `In a neutral atom, the positive charge of the protons (${el.z}) must be perfectly balanced by an equal number of negatively charged electrons (${el.z}).`, 
            difficulty
        )
      );

      // Classification & States
      if (el.group !== "Unknown") {
          quizBank["Periodic Trends & Classification"].push(
              buildMultipleChoice(
                  `Which chemical group does ${el.name} belong to?`, 
                  el.group, 
                  allGroups, 
                  `Based on its valence electron configuration and position on the periodic table, ${el.name} is classified in the ${el.group} family.`, 
                  difficulty
              )
          );
      }
      
      if (el.state === "Solid" || el.state === "Liquid" || el.state === "Gas") {
          quizBank["Periodic Trends & Classification"].push(
              buildMultipleChoice(
                  `At standard room temperature and pressure, what is the state of matter for ${el.name}?`, 
                  el.state, 
                  states, 
                  `At standard room temperature (298 K) and pressure (1 atm), the natural thermodynamic state of ${el.name} is a ${el.state.toLowerCase()}.`, 
                  difficulty
              )
          );
      }
    });

    for (let i = 0; i < 300; i++) {
        const selected = shuffle(elements).slice(0, 4);
        
        const heaviest = selected.reduce((prev, curr) => (prev.mass > curr.mass) ? prev : curr);
        const difficultyHeaviest = selected.some(e => getDifficulty(e.z, e.symbol) === "Hard") ? "Hard" : "Intermediate";
        
        quizBank["Periodic Trends & Classification"].push(
            buildMultipleChoice(
                `Which of the following elements has the highest atomic mass?`, 
                heaviest.name, 
                selected.map(e => e.name), 
                `Among these options, ${heaviest.name} is the heaviest with an atomic mass of ${heaviest.mass} amu, meaning it has the most protons and neutrons combined.`, 
                difficultyHeaviest
            )
        );

        const enValid = selected.filter(e => e.en !== null);
        if (enValid.length === 4) {
            const mostEN = enValid.reduce((prev, curr) => (prev.en > curr.en) ? prev : curr);
            quizBank["Periodic Trends & Classification"].push(
                buildMultipleChoice(
                    `Based on periodic trends, which of these elements is the most electronegative?`, 
                    mostEN.name, 
                    enValid.map(e => e.name), 
                    `Electronegativity (the ability to attract shared electrons) generally increases as you move up and to the right across the periodic table. ${mostEN.name} has the highest value here (${mostEN.en}).`, 
                    "Intermediate"
                )
            );
        }
    }

    const metals = elements.filter(e => e.isMetal);
    const nonmetals = elements.filter(e => !e.isMetal && e.group !== "Noble Gas" && e.group !== "Unknown");
    const bondTypes = ["Ionic", "Covalent", "Metallic", "Hydrogen"];

    for (let i = 0; i < 300; i++) {
        const m = metals[Math.floor(Math.random() * metals.length)];
        const nm = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        const diffIonic = (getDifficulty(m.z, m.symbol) === "Hard" || getDifficulty(nm.z, nm.symbol) === "Hard") ? "Hard" : "Intermediate";
        
        quizBank["Basic Chemical Bonding & Formulas"].push(
            buildMultipleChoice(
                `If ${m.name} reacts with ${nm.name}, what primary type of bond will form?`, 
                "Ionic", 
                bondTypes, 
                `Ionic bonds typically form between a metal (${m.symbol}) and a nonmetal (${nm.symbol}) due to a large difference in electronegativity, resulting in the complete transfer of electrons.`, 
                diffIonic
            )
        );

        const nm1 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        let nm2 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        while(nm1.symbol === nm2.symbol) nm2 = nonmetals[Math.floor(Math.random() * nonmetals.length)];
        
        quizBank["Basic Chemical Bonding & Formulas"].push(
            buildMultipleChoice(
                `What type of primary bond forms between ${nm1.name} and ${nm2.name}?`, 
                "Covalent", 
                bondTypes, 
                `Covalent bonds form when two nonmetals (${nm1.symbol} and ${nm2.symbol}) share valence electrons to achieve stable electron configurations, as neither is strong enough to completely pull electrons away from the other.`, 
                "Intermediate"
            )
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