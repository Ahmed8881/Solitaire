import Deck from "./deck.js";
import Queue from "./Queue.js";
import Stack from "./Stack.js";

let stockpile = new Queue();
let wastePile = new Stack();
let foundation1 = new Stack();
let foundation2 = new Stack();
let foundation3 = new Stack();
let foundation4 = new Stack();
let tableauColumns = [
  new Stack(),
  new Stack(),
  new Stack(),
  new Stack(),
  new Stack(),
  new Stack(),
  new Stack(),
];
let timerInterval;
let elapsedTime = 0;
let moveCount = 0;
let score = 0;
let previousStates = [];
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").addEventListener("click", function () {
    document.getElementById("landingPage").style.display = "none";
    document.getElementById("difficultyLevels").classList.remove("hidden");
  });

  document.getElementById("easyButton").addEventListener("click", function () {
    startGame("easy");
  });

  document
    .getElementById("mediumButton")
    .addEventListener("click", function () {
      startGame("medium");
    });

  document.getElementById("hardButton").addEventListener("click", function () {
    startGame("hard");
  });
});

function startGame(difficulty) {
  document.getElementById("difficultyLevels").classList.add("hidden");
  document.getElementById("gameContent").classList.remove("hidden");
  initializeGame(difficulty);
  playBackgroundMusic();
}

function initializeGame(difficulty) {
  const deck = new Deck();
  if (difficulty === "easy") {
    deck.shuffleEasy();
  } else if (difficulty === "medium") {
    deck.shuffleMedium();
  } else if (difficulty === "hard") {
    deck.shuffleHard();
  }
  const { tableau: initialTableau, stock: initialStock } =
    dealInitialCards(deck);
  tableauColumns = initialTableau;
  stockpile = initialStock;
  updateUI(tableauColumns, stockpile);
  setupEventListeners();
  updateWastePile();
  startTimer();
  playBackgroundMusic();
}

function dealInitialCards(deck) {
  const tableau = [];
  for (let i = 0; i < 7; i++) {
    tableau[i] = new Stack();
    deck.deal(i + 1).forEach((card, index) => {
      card.faceUp = index === i;
      card.rank = card.rank;
      card.suit = card.suit;
      card.color =
        card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
      tableau[i].push(card);
    });
  }
  const stock = new Queue();
  deck.deal(deck.cards.length).forEach((card) => {
    card.faceUp = false;
    card.rank = card.rank;
    card.suit = card.suit;
    card.color =
      card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black"; // Set the color attribute
    stock.enqueue(card);
  });
  return { tableau, stock };
}

function isValidTableauMove(draggedCard, targetCard) {
  // Allow any card on empty column
  if (!targetCard) {
    return true;
  }

  const ranks = [
    "ace",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "jack",
    "queen",
    "king",
  ];

  const draggedRankIndex = ranks.indexOf(draggedCard.rank.toLowerCase());
  const targetRankIndex = ranks.indexOf(targetCard.rank.toLowerCase());

  // Validate descending sequence
  let correctSequence;
  if (draggedRankIndex == 0 && targetRankIndex == 1) {
    correctSequence = true;
  } else {
    correctSequence = draggedRankIndex === targetRankIndex - 1;
  }
  const isColorDiff = isDifferntColoredCards(draggedCard, targetCard);

  return correctSequence && isColorDiff;
}

function isDifferntColoredCards(draggedCard, targetCard) {
  const redSuits = ["hearts", "diamonds"];
  const blackSuits = ["clubs", "spades"];

  const draggedCardIsRed = redSuits.includes(draggedCard.suit.toLowerCase());
  const targetCardIsRed = redSuits.includes(targetCard.suit.toLowerCase());

  return draggedCardIsRed !== targetCardIsRed;
}

function setupEventListeners() {
  const stockPileUI = document.getElementById("stockPile");
  stockPileUI.addEventListener("click", handleStockClick);

  const wastePileUI = document.getElementById("wastePile");
  wastePileUI.addEventListener("dragstart", handleDragStart);
  wastePileUI.addEventListener("dragover", handleDragOver);
  wastePileUI.addEventListener("drop", handleDrop);
  wastePileUI.addEventListener("dragend", handleDragEnd);

  const tableauColumns = document.querySelectorAll(".tableaus");
  tableauColumns.forEach((column) => {
    column.addEventListener("dragstart", handleDragStart);
    column.addEventListener("dragover", handleDragOver);
    column.addEventListener("drop", handleDropOnTableau);
  });

  const foundationPiles = document.querySelectorAll(".foundationSpiles");
  foundationPiles.forEach((pile) => {
    pile.addEventListener("dragover", handleDragOver);
    pile.addEventListener("drop", handleDropOnFoundation);
  });

  document.getElementById("undoButton").addEventListener("click", undoLastMove);
}

function handleStockClick() {
  saveCurrentState();

  if (!stockpile.isEmpty()) {
    const card = stockpile.dequeue();
    wastePile.push(card);
    updateWastePile();
    updateStockPile();
    // incrementMoveCount();
  } else {
    resetStockPile();
  }
}

function handleDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.id);
  event.target.classList.add("dragging");

  // Store the original parent and position
  event.target.dataset.originalParentId = event.target.parentElement.id;
  event.target.dataset.originalLeft = event.target.offsetLeft;
  event.target.dataset.originalTop = event.target.offsetTop;

  // Store the index of the dragged card and all cards below it
  const parent = event.target.parentElement;
  const children = Array.from(parent.children);
  const startIndex = children.indexOf(event.target);
  const cardsToMove = children.slice(startIndex).map((card) => card.id);
  event.dataTransfer.setData("cardsToMove", JSON.stringify(cardsToMove));
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  saveCurrentState();
  event.preventDefault();
  const id = event.dataTransfer.getData("text");
  const cardsToMove = JSON.parse(event.dataTransfer.getData("cardsToMove"));
  const dropzone = event.target.closest(".tableaus, .foundationSpiles");
  if (dropzone) {
    cardsToMove.forEach((cardId) => {
      const draggableElement = document.getElementById(cardId);
      dropzone.appendChild(draggableElement);
    });
    updateTableauColumn(dropzone);
    incrementMoveCount();
    event.dataTransfer.clearData();
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function handleDropOnTableau(event) {
  debugger;
  saveCurrentState();
  event.preventDefault();

  const cardsToMove = JSON.parse(event.dataTransfer.getData("cardsToMove"));

  const dropzone = event.target.closest(".tableaus");
  const targetCard = event.target.closest(".card");

  // Get dragged card info (only the first card in the list)
  const firstCardId = cardsToMove[0];
  const draggableElement = document.getElementById(firstCardId);
  // console.log(typeof(dropzone.id[(dropzone.id).length - 1]))
  let tabule_number = dropzone.id[dropzone.id.length - 1];
  tabule_number = parseInt(tabule_number);

  const draggedCardInfo = {
    rank: draggableElement.getAttribute("data-rank"),
    suit: draggableElement.getAttribute("data-suit"),
    color: draggableElement.getAttribute("data-color"),
    faceUp: true,
  };
  
  // console.log("tableue column saved",tableauColumns[tabule_number-1])
  tableauColumns[tabule_number - 1].push(draggedCardInfo);
  // console.log("Working here")

  // Get target card info
  let targetCardInfo = null;
  if (targetCard) {
    targetCardInfo = {
      rank: targetCard.getAttribute("data-rank"),
      suit: targetCard.getAttribute("data-suit"),
      color: targetCard.getAttribute("data-color"),
    };
  }
  debugger;
  if (!targetCard && draggedCardInfo.rank !== "King") {
    showToaster("Only a King can be placed on an empty tableau!");
    return;
  }

  // Validate move
  if (isValidTableauMove(draggedCardInfo, targetCardInfo)) {
    const originalParent = document.getElementById(
      draggableElement.dataset.originalParentId
    );

    let originalColumnIndex =
      parseInt(originalParent.id.replace("tableauColumn", "")) - 1;
    if (originalColumnIndex == 1) {
      originalColumnIndex = parseInt(
        originalParent.id.replace("tableauColumn", "")
      );
    }

    // Move each card in the list to the dropzone

    cardsToMove.forEach((cardId) => {
      const cardElement = document.getElementById(cardId);

      dropzone.appendChild(cardElement);
    });
       // Remove the moved cards from the original tableau column
       cardsToMove.forEach((cardId) => {
        removeCardFromSource(cardId);
      });
  debugger;

    updateTableauColumn(dropzone);
    removeCardFromSource(firstCardId);
    incrementMoveCount();
    incrementScore();

    // Flip the next card in the original tableau
    if (originalParent && originalColumnIndex >= 0) {
      flipNextCardInTableau(originalParent, originalColumnIndex);
    }
    // Check for win
    if (checkForWin()) {
      showWinMessage();
    }
  } else {
    showToaster("Invalid move!");
    if (score > 0) {
      decrementScore();
    }
    // Reset the cards' positions and parents
    cardsToMove.forEach((cardId) => {
      const cardElement = document.getElementById(cardId);
      const originalParent = document.getElementById(
        cardElement.dataset.originalParentId
      );
      originalParent.appendChild(cardElement);
      cardElement.style.position = "absolute";
      cardElement.style.left = `${cardElement.dataset.originalLeft}px`;
      cardElement.style.top = `${cardElement.dataset.originalTop}px`;
    });
  }
  event.dataTransfer.clearData();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function flipNextCardInTableau(originalParent, originalColumnIndex) {
  let originalColumn = tableauColumns[originalColumnIndex];
  if (originalColumn.items.length > 0) {
    const nextCard = originalColumn.items[originalColumn.items.length - 1];

    if (nextCard.rank && nextCard.suit) {
      const nextCardElement = originalParent.querySelector(".card:last-child");
      nextCardElement.src = `DeckCards/${nextCard.rank}_of_${nextCard.suit}.png`;
      nextCardElement.alt = `${nextCard.rank} of ${nextCard.suit}`;
      nextCardElement.draggable = true;
      nextCard.faceUp = true; // Set the faceUp property to true
      nextCardElement.setAttribute("data-rank", nextCard.rank); // Ensure data-rank is set
      nextCardElement.setAttribute("data-suit", nextCard.suit); // Ensure data-suit is set
      nextCardElement.addEventListener("dragstart", handleDragStart);
      nextCardElement.addEventListener("dragover", handleDragOver);
      nextCardElement.addEventListener("drop", handleDrop);
      nextCardElement.addEventListener("dragend", handleDragEnd);
    } else {
      console.error("Rank or Suit is undefined");
    }
  }
}
function handleDropOnFoundation(event) {
  debugger;
  saveCurrentState();
  event.preventDefault();
  const id = event.dataTransfer.getData("text");
  const draggableElement = document.getElementById(id);
  const dropzone = event.target.closest(".foundationSpiles");
  debugger;
  if (!dropzone) {
    console.log("Dropzone not found");
    return;
  }

  const targetCard = dropzone.querySelector(".card:last-child");

  console.log("Draggable Element ID:", id);
  console.log("Dropzone:", dropzone);
  console.log("Target Card:", targetCard);

  const draggedCardInfo = {
    rank: draggableElement.getAttribute("data-rank"),
    suit: draggableElement.getAttribute("data-suit"),
    color: draggableElement.getAttribute("data-color"),
  };

  let targetCardInfo = null;
  if (targetCard) {
    targetCardInfo = {
      rank: targetCard.getAttribute("data-rank"),
      suit: targetCard.getAttribute("data-suit"),
      color: targetCard.getAttribute("data-color"),
    };
  }

  console.log("Dragged Card Info:", draggedCardInfo);
  console.log("Target Card Info:", targetCardInfo);

  if (isValidFoundationMove(draggedCardInfo, targetCardInfo)) {
    dropzone.appendChild(draggableElement);
    removeCardFromSource(id);

    if (dropzone.id === "foundation1") {
      foundation1.push(draggedCardInfo);
    } else if (dropzone.id === "foundation2") {
      foundation2.push(draggedCardInfo);
    } else if (dropzone.id === "foundation3") {
      foundation3.push(draggedCardInfo);
    } else if (dropzone.id === "foundation4") {
      foundation4.push(draggedCardInfo);
    }

    updateFoundationPile(dropzone);
    incrementMoveCount();
    incrementScore();

    const originalParent = document.getElementById(
      draggableElement.dataset.originalParentId
    );
    let originalColumnIndex =
      parseInt(originalParent.id.replace("tableauColumn", "")) - 1;
    if (originalColumnIndex == 0) {
      originalColumnIndex = parseInt(
        originalParent.id.replace("tableauColumn", "")
      );
    }
    debugger;
    if (draggableElement.dataset.originalParentId.startsWith("tableauColumn")) {
      flipNextCardInTableau(originalParent, originalColumnIndex);
    }
    draggableElement.setAttribute("draggable", "false"); 
    const win = checkForWin();
    if (win) {
      debugger;

      showWinMessage();
    }
  } else {
    showToaster("Invalid move!");
    if (score > 0) {
      decrementScore();
    }
    const originalParent = document.getElementById(
      draggableElement.dataset.originalParentId
    );
    originalParent.appendChild(draggableElement);
    draggableElement.style.position = "absolute";
    draggableElement.style.left = `${draggableElement.dataset.originalLeft}px`;
    draggableElement.style.top = `${draggableElement.dataset.originalTop}px`;
  }

  event.dataTransfer.clearData();
}
function showWinMessage() {
  stopBackgroundMusic();
  showToaster("Congratulations! You won!");
  clearInterval(timerInterval);
  setTimeout(() => {
    document.getElementById("gameContent").classList.add("hidden");
    document.getElementById("landingPage").style.display = "flex";
  }, 5000);
}
function checkForWin() {
  const foundationPiles = [foundation1, foundation2, foundation3, foundation4];
  const requiredCardsInFoundation = 13;

  for (let pile of foundationPiles) {
    if (pile.length !== requiredCardsInFoundation) {
      return false;
    }
  }

  return true;
}
function isValidFoundationMove(draggedCard, targetCard) {
  const ranks = [
    "ace",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "jack",
    "queen",
    "king",
  ];
  debugger;

  // If the foundation pile is empty, the first card must be an ace
  if (!targetCard) {
    return draggedCard.rank.toLowerCase() === "ace";
  }

  const draggedRankIndex = ranks.indexOf(draggedCard.rank.toLowerCase());
  const targetRankIndex = ranks.indexOf(targetCard.rank.toLowerCase());

  // Validate ascending sequence and same suit
  const correctSequence = draggedRankIndex === targetRankIndex + 1;
  const sameSuit =
    draggedCard.suit.toLowerCase() === targetCard.suit.toLowerCase();

  return correctSequence && sameSuit;
}

function handleDragEnd(event) {
  event.target.classList.remove("dragging");

  // Reset the card's position if not valid
  if (!event.target.closest(".tableaus, .foundationSpiles")) {
    const originalParent = document.getElementById(
      event.target.dataset.originalParentId
    );
    originalParent.appendChild(event.target);
    event.target.style.position = "absolute";
    event.target.style.left = `${event.target.dataset.originalLeft}px`;
    event.target.style.top = `${event.target.dataset.originalTop}px`;
  }
}

function resetStockPile() {
  while (!wastePile.isEmpty()) {
    const card = wastePile.pop();

    stockpile.enqueue(card);
  }
  updateStockPile();
  updateWastePile();
}

function startTimer() {
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  elapsedTime++;
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  document.getElementById("time").textContent = `${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
}

function updateTableauColumn(column) {
  debugger;

  const cards = column.querySelectorAll(".card");
  cards.forEach((card, index) => {
    card.style.top = `${index * 20}px`;
    if (index === cards.length - 1) {
      card.classList.add("face-up");
      card.classList.remove("face-down");
    } else {
      card.classList.add("face-down");
      card.classList.remove("face-up");
    }
  });
}

function updateFoundationPile(pile) {
  const cards = pile.querySelectorAll(".card");
  cards.forEach((card, index) => {
    card.style.top = `${index * 0}px`;
  });
}

function removeCardFromSource(cardId) {
  debugger;

  const cardIndex = parseInt(cardId.split("-")[2]);
  if (cardId.startsWith("waste-card")) {
    // Remove the last card from the waste pile using pop
    wastePile.pop();
    updateWastePile();
  } else if (cardId.startsWith("card")) {
    const [_, columnIndex, cardIndex] = cardId.split("-").map(Number);
    tableauColumns[columnIndex].items.splice(cardIndex, 1);
    const columnElement = document.getElementById(
      `tableauColumn${columnIndex + 1}`
    );
    // updateTableauColumn(columnElement);
  }
}

function incrementMoveCount() {
  moveCount++;
  document.getElementById("moves").textContent = moveCount
    .toString()
    .padStart(2, "0");
}

function incrementScore() {
  score += 5;
  document.getElementById("Score").textContent = score
    .toString()
    .padStart(2, "0");
}

function decrementScore() {
  score -= 5;
  document.getElementById("Score").textContent = score
    .toString()
    .padStart(2, "0");
}

function playBackgroundMusic() {
  const backgroundMusic = document.getElementById("backgroundMusic");
  backgroundMusic.play();
}

function stopBackgroundMusic() {
  const backgroundMusic = document.getElementById("backgroundMusic");
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function showToaster(message) {
  const toaster = document.getElementById("toaster");
  toaster.textContent = message;
  toaster.className = "toaster show";
  setTimeout(() => {
    toaster.className = toaster.className.replace("show", "");
  }, 3000);
}

function saveCurrentState() {
  const state = {
    stockpile: stockpile.clone(),
    wastePile: wastePile.clone(),
    foundation1: foundation1.clone(),
    foundation2: foundation2.clone(),
    foundation3: foundation3.clone(),
    foundation4: foundation4.clone(),
    tableauColumns: tableauColumns.map((column) => column.clone()),
    elapsedTime,
    moveCount,
    score,
  };
  previousStates.push(state);
  //  console.log(state.tableauColumns)
}

function undoLastMove() {
  incrementMoveCount();
  if (previousStates.length === 0) {
    showToaster("No moves to undo!");
    return;
  }

  const lastState = previousStates.pop();
  stockpile = lastState.stockpile;
  wastePile = lastState.wastePile;
  foundation1 = lastState.foundation1;
  foundation2 = lastState.foundation2;
  foundation3 = lastState.foundation3;
  foundation4 = lastState.foundation4;
  tableauColumns = lastState.tableauColumns;

  updateUI(tableauColumns, stockpile);
  updateWastePile();
  updateStockPile();
  updateFoundationPiles();
  document.getElementById("moves").textContent = moveCount
    .toString()
    .padStart(2, "0");
  document.getElementById("Score").textContent = score
    .toString()
    .padStart(2, "0");
}

function updateUI(tableau, stock) {
  tableau.forEach((column, index) => {
    const tableauColumnUI = document.getElementById(
      `tableauColumn${index + 1}`
    );
    tableauColumnUI.innerHTML = "";

    column.items.forEach((card, cardIndex) => {
      const cardFace = card.faceUp ? "up" : "down";
      const cardElement = document.createElement("img");

      cardElement.className = `card card-small tableauCard ${
        card.faceUp ? "face-up" : ""
      }`;
      cardElement.id = `card-${index}-${cardIndex}`;
      cardElement.draggable = cardFace === "up";
      cardElement.style.top = `${cardIndex * 20}px`;

      if (cardFace === "up") {
        cardElement.src = `DeckCards/${card.rank}_of_${card.suit}.png`;
        cardElement.alt = `${card.rank} of ${card.suit}`;

        // Add data attributes for validation
        cardElement.setAttribute("data-rank", card.rank);
        cardElement.setAttribute("data-suit", card.suit);
        cardElement.setAttribute("data-color", card.color);
      } else {
        cardElement.src = "Images/CardBg.jpg";
        cardElement.alt = "Card back";
      }

      // Add event listeners
      if (cardFace === "up") {
        cardElement.addEventListener("dragstart", handleDragStart);
        cardElement.addEventListener("dragover", handleDragOver);
        cardElement.addEventListener("drop", handleDrop);
        cardElement.addEventListener("dragend", handleDragEnd);
      }

      tableauColumnUI.appendChild(cardElement);
    });
  });
}

function updateWastePile() {
  const wastePileUI = document.getElementById("wastePile");
  wastePileUI.innerHTML = "";

  wastePile.items.forEach((card, index) => {
    const cardElement = document.createElement("img");
    cardElement.id = `waste-card-${index}`;
    cardElement.className = "card card-small";
    cardElement.src = `DeckCards/${card.rank}_of_${card.suit}.png`;
    cardElement.alt = `${card.rank} of ${card.suit}`;
    cardElement.draggable = true;

    // Add data attributes for validation
    cardElement.setAttribute("data-rank", card.rank);
    cardElement.setAttribute("data-suit", card.suit);
    cardElement.setAttribute("data-color", card.color);

    cardElement.addEventListener("dragstart", handleDragStart);
    wastePileUI.appendChild(cardElement);
  });
}

function updateStockPile() {
  const stockPileUI = document.getElementById("stockPile");
  stockPileUI.innerHTML = "";
  stockpile.items.forEach((card) => {
    stockPileUI.innerHTML += `<img class="card card-small" src="Images/CardBg.jpg" alt="${card.rank} of ${card.suit}">`;
  });
}

function updateFoundationPiles() {
  const foundationPiles = [
    { pile: foundation1, elementId: "foundation1" },
    { pile: foundation2, elementId: "foundation2" },
    { pile: foundation3, elementId: "foundation3" },
    { pile: foundation4, elementId: "foundation4" },
  ];

  foundationPiles.forEach(({ pile, elementId }) => {
    const foundationPileUI = document.getElementById(elementId);
    foundationPileUI.innerHTML = "";

    pile.items.forEach((card, index) => {
      const cardElement = document.createElement("img");
      cardElement.id = `foundation-card-${elementId}-${index}`;
      cardElement.className = "card card-small";
      cardElement.src = `DeckCards/${card.rank}_of_${card.suit}.png`;
      cardElement.alt = `${card.rank} of ${card.suit}`;
      cardElement.draggable = true;

      // Add data attributes for validation
      cardElement.setAttribute("data-rank", card.rank);
      cardElement.setAttribute("data-suit", card.suit);
      cardElement.setAttribute("data-color", card.color);

      cardElement.addEventListener("dragstart", handleDragStart);
      foundationPileUI.appendChild(cardElement);
    });
  });
}
