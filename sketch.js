let data;
let maxRipe = 0; //massimo numero di ripetizioni, dimensione dell'osso più lungo
let totalWeight = 0; //totale di tutte le larghezze dei diversi ossi
// Margine attorno al grafico
let margin = 30;

// Spazio tra le barre del grafico
let gutter = 2;

// Variabili per l'interazione col mouse
let hoveredLabel = "";
let hoveredReps = "";
let hovered = false;
let hoveredRow = -1;


async function setup() {
  //creo lo spazio di lavoro
  createCanvas(windowWidth, windowHeight);

  //carico i dati
  data = await loadTable("assets/DogIntelligence.csv", ",", "header");

  for (let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++) {
    let Weight = data.getNum(rowNumber, "weight_high_lbs");
    let Ripe = data.getNum(rowNumber, "reps_upper");

    // Conserva il valore massimo, necessario per capire la dimensione dell'osso più lungo e proporzionare il resto
    if (Ripe > maxRipe) {
      maxRipe = Ripe;
    }

    // Il totale del peso serve a distribuire le barre lungo tutta la circonferenza
    totalWeight += (Weight); //è necessario impostare un peso minimo per evitare che i cani che pesano poco occupino un angolo talmente stretto da sovrapporsi con altri
  }
}

function draw() {
  background("#FBF6EE");
  noStroke(); 
  
   // Centro del cerchio e raggi: gli ossi partono dal raggio interno e crescono verso l'esterno.
  let centerX = width / 2;
  let centerY = height / 2;
  let outerRadius = height / 2 - margin; //limite esterno massimo
  let innerRadius = outerRadius*0.5; //limite interno
  let maxLength = outerRadius - innerRadius; //lunghezza massima dell'osso

  //calcolo lo spazio che rimane a disposizione per le osse sottraendo alla misura della cirnconferenza il numero di righe del dataset
  let barsWidth = TWO_PI * innerRadius - data.getRowCount()*gutter;

  // xPos tiene traccia di dove iniziare il prossimo osso
  let xPos = 0;

  //imposto il valore di hovered a false come partenza per poi controllarlo
  hovered = false;
  let previousHoveredRow = hoveredRow;
  hoveredRow = -1; //parto dal presupposto che il mouse non sia hover a niente

  title(); //richiamo la funzione che mi scrive titolo e legenda
  bowl(centerX, centerY, innerRadius, maxLength, maxRipe); //richiamo la funzione che mi disegna la ciotola

  // Ogni riga del dataset diventa una barra del grafico.
  for (let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++) {
    let currentRipe = data.getNum(rowNumber, "reps_upper"); //valore corrente lunghezza
    let currentWeight = data.getNum(rowNumber, "weight_high_lbs"); //valore corrente larghezza
    let dogName = data.getString(rowNumber, "Breed"); //valore corrente razza cane

    let scaledWeight = map(currentWeight, 0, totalWeight, 0, barsWidth);
    let scaledRipe = map(currentRipe, 0, maxRipe, 0, maxLength);
    let angle = PI + (xPos + scaledWeight / 2) / innerRadius;

    // Un osso non puo essere piu corto di una volta e mezzo la sua larghezza, altrimenti i nodi coprono il corpo centrale e si vedono solo dei pallini
    scaledRipe = max(scaledRipe, scaledWeight * 1.3);

    let colorBone;
    if (previousHoveredRow !== -1 && rowNumber !== previousHoveredRow) {
      colorBone = color(183, 111, 50, 90);
    } else {
      colorBone = color("#b76f32"); 
    }

    //funzione per disegnare l'osso
    bones(centerX, centerY, angle, scaledWeight, scaledRipe, innerRadius, colorBone); 

    if (isOverBone(centerX, centerY, angle, scaledWeight, scaledRipe, innerRadius)) {
      hoveredLabel = dogName;     // memorizza la razza
      hoveredReps = currentRipe;  // memorizza le ripetizioni
      hovered = true;             // stato di hover attivo
      hoveredRow = rowNumber;
    }

    //Si sposta all'osso successivo, lasciando il gutter tra i due
    xPos += scaledWeight + gutter;
  }

  drawHoverInfo(hovered, hoveredLabel, hoveredReps);  
}

function title() {
  //scritta di presentazione e legenda
  push();
  noStroke();
  fill(0);
  textFont('monospace'); 
  textAlign(LEFT, BASELINE);
  //titolo
  fill("#df7712");
  textSize(30);
  textStyle(BOLD); 
  text("LA CIOTOLA DEI PREMI", 25, 50);
  //sottotitolo
  textSize(20);
  textStyle(NORMAL);
  text("Quante ripetizioni servono a un cane\nper imparare un nuovo comando", 25, 80);
  //legenda
  textSize(15);
  text("Lunghezza: ripetizioni richieste a quella razza\nper imparare il comando\nSpessore: peso della razza del cane", 25, 150);
  text("Le razze sono disposte in senso orario dalle più\nleggere alle più pesanti", 25, 220);
  pop();
}

function bowl(cx, cy, innerRadius, maxLength, maxReps, step = 25) {
  push();
  noFill();
  stroke("#df7712");
  strokeWeight(1);

  // cerchio interno dove partono le ossa
  circle(cx, cy, innerRadius * 2-10); //tolgo 10 per non farlo proprio toccare con la linea

  textFont("monospace");
  textSize(15);
  textAlign(RIGHT, BASELINE);

  //ogni intervallo deciso da step disegna un cerchio e scrive il rispettivo valore
  for (let v = step; v <= maxReps; v += step) {
    let r = innerRadius + map(v, 0, maxReps, 0, maxLength);

    noFill();
    stroke("#df7712");
    circle(cx, cy, r * 2+10); //aggiungo 10 per non farlo proprio toccare con la linea

    noStroke();
    fill("#df7712");
    text(v, cx - 5, cy - r-10);
  }
  pop();
}

function bones(x, y, angle, thick, length, interad, color) {
  push();
  translate(x, y);
  rotate(angle);

  fill(color);
  //diametro del cerchio
  let diam = thick / 2;
  //corpo dell'osso
  rect(-thick * 0.2, interad + diam / 2, thick * 0.4, length - diam);
  //cerchi in alto
  circle(-thick * 0.25, interad + diam / 2, diam);
  circle(thick * 0.25, interad + diam / 2, diam);
  //cerchi in basso
  circle(-thick * 0.25, interad + length - diam / 2, diam);
  circle(thick* 0.25, interad+ length- diam / 2, diam);
  pop(); 
}

function isOverBone(cx, cy, angle, thick, length, interad) {
  // porto il mouse nel sistema di coordinate ruotato dell'osso
  let dx = mouseX - cx;
  let dy = mouseY - cy;

  // ruoto il punto di -angle (rotazione inversa) per farlo tornare verticale
  let localX = dx * cos(-angle) - dy * sin(-angle);
  let localY = dx * sin(-angle) + dy * cos(-angle);

  // ora che l'osso è verticale controllo larghezza (X) e lunghezza (Y)
  return (
    localX >= -thick / 2 &&
    localX <= thick / 2 &&
    localY >= interad &&
    localY <= interad + length
  );
}

function drawHoverInfo(isHovered, label, reps) {
  if (!isHovered) {
    cursor(ARROW); // il cursore torna la freccina classica
    return;
  }
  cursor(HAND); // il cursore diventa una manina

  push();
  noStroke();
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  textFont("monospace");
  text(label, width / 2, height / 2);
  text("Ripetizioni necessarie: " + reps, width / 2, height / 2 + 30);
  pop();
}

