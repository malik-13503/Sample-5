const wheelCanvas = document.getElementById('wheelCanvas');
const ctx = wheelCanvas.getContext('2d');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const spinButton = document.getElementById('spinButton');
const winMessage = document.getElementById('winMessage');
const ucoinDisplay = document.querySelector('.coin-balance');
const betInput = document.getElementById('betInput');
const gameContainer = document.querySelector('.container');

let ucoins = parseInt(localStorage.getItem('ucoins')) || 0; // Load coin balance from localStorage

function updateCoinBalance() {
    localStorage.setItem('ucoins', ucoins); // Update localStorage whenever coins change
    ucoinDisplay.innerText = `${ucoins.toFixed(2)} Ucoin`; // Update the displayed balance
}

const segments = ['Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down'];
const alternateColors = ['#FFD700', '#FF0000', '#FFD700', '#FF0000', '#FFD700', '#FF0000', '#FFD700', '#FF0000'];

let currentAngle = 0;
let isSpinning = false;
let userChoice = null;

const spinSound = new Audio('/sounds/spin-sound.mp3');
spinSound.loop = true;
spinSound.volume = 1;
spinSound.playbackRate = 1;

const resultModal = document.getElementById('resultModal');
const resultMessage = document.getElementById('resultMessage');
const closeModalButton = document.getElementById('closeModalButton');

gameContainer.style.filter = 'none';

// Call this function to set the initial balance when the page loads
updateCoinBalance();

function showResultModal(message) {
    resultMessage.innerText = message;
    resultModal.style.display = 'flex';
}

function closeModal() {
    resultModal.style.display = 'none';
}

closeModalButton.addEventListener('click', closeModal);

function drawWheel() {
    const wheelRadius = wheelCanvas.width / 2;
    const arcSize = (2 * Math.PI) / segments.length;

    segments.forEach((segment, index) => {
        const angle = index * arcSize;

        ctx.beginPath();
        ctx.arc(wheelRadius, wheelRadius, wheelRadius, angle, angle + arcSize, false);
        ctx.lineTo(wheelRadius, wheelRadius);

        ctx.fillStyle = alternateColors[index % alternateColors.length];

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fill();
        ctx.save();

        ctx.translate(wheelRadius, wheelRadius);
        ctx.rotate(angle + arcSize / 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(segment, 60, 10);
        ctx.restore();
    });
}

function spinWheel() {
    if (isSpinning || userChoice === null) {
        return;
    }

    const betAmount = parseInt(betInput.value, 10);

    if (isNaN(betAmount) || betAmount <= 0 || betAmount > ucoins) {
        winMessage.innerText = "Please enter a valid bet amount.";
        isSpinning = false;
        return;
    }

    isSpinning = true;
    winMessage.innerText = "";

    spinSound.currentTime = 0;
    spinSound.volume = 1;
    spinSound.play();

    const spinTime = Math.random() * 3000 + 7000;
    const totalRotation = Math.random() * 360 + 1440;

    const startTime = Date.now();

    function easeOut(t) {
        return t * (2 - t);
    }

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinTime, 1);

        const easedProgress = easeOut(progress);
        currentAngle = easedProgress * totalRotation;

        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        ctx.save();
        ctx.translate(wheelCanvas.width / 2, wheelCanvas.height / 2);
        ctx.rotate((currentAngle * Math.PI) / 180);
        ctx.translate(-wheelCanvas.width / 2, -wheelCanvas.height / 2);
        drawWheel();
        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            const finalAngle = currentAngle % 360;
            const adjustedAngle = (360 - finalAngle + 90) % 360;
            const resultIndex = Math.floor((adjustedAngle / 360) * segments.length) % segments.length;
            const result = segments[resultIndex];
            handleResult(result);
            isSpinning = false;

            spinSound.pause();
            spinSound.currentTime = 0;
        }
    }
    animate();
}

const winSound = new Audio('/sounds/win-sound.mp3');
const loseSound = new Audio('/sounds/lose-sound.mp3');

function handleResult(result) {
    let message = ''; // Message to display in the result modal
    let isWin = false; // Flag to determine if the player won
    
    // Check if the player's choice matches the wheel result
    if (result === userChoice) {
        // Player wins, update ucoins and prepare the win message
        ucoins += parseInt(betInput.value, 10);
        message = `You won ${betInput.value} Ucoins!🎁`;
        isWin = true;
        
        // Play win sound
        winSound.play();
    } else {
        // Player loses, deduct the bet amount and prepare the lose message
        ucoins -= parseInt(betInput.value, 10);
        message = `🙁 You Lose ${betInput.value} Ucoins.`;
        
        // Play lose sound
        loseSound.play();
    }
    
    // Update the displayed coin balance
    updateCoinBalance();

    // Show the result modal with the prepared message
    showResultModal(message);

    // Reset the user choice and disable the spin button until they make a new choice
    userChoice = null;
    spinButton.disabled = true;
    spinButton.style.cursor = 'not-allowed';
}

const DAILY_REWARD = 100;

async function getUserIP() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

async function checkAndRewardCoins() {
    const userIP = await getUserIP();
    const lastRewardDate = localStorage.getItem(`lastReward_${userIP}`);
    const today = new Date().toISOString().split('T')[0];

    if (lastRewardDate !== today) {
        ucoins += DAILY_REWARD; // Add daily reward
        localStorage.setItem(`lastReward_${userIP}`, today); // Update the last reward date
        updateCoinBalance(); // Update the displayed coin balance
        showDailyRewardMessage(); // Show reward message
    }
}

// Call this function when the page loads
window.onload = async () => {
    await checkAndRewardCoins(); // Ensure to wait for the function to get the IP and check rewards
    updateCoinBalance(); // Update the displayed balance initially
};

function showDailyRewardMessage() {
    const rewardMessageElement = document.getElementById('dailyRewardMessage');
    rewardMessageElement.innerText = `🎉 You've received your daily reward of ${DAILY_REWARD} Ucoins!`;
    rewardMessageElement.style.display = 'block';

    setTimeout(() => {
        rewardMessageElement.classList.add('fade-out');
        setTimeout(() => {
            rewardMessageElement.style.display = 'none';
            rewardMessageElement.classList.remove('fade-out');
        }, 1000);
    }, 3000);
}

// Event listeners for button clicks
upButton.addEventListener('click', () => {
    if (!isSpinning) {
        userChoice = 'Up';
        spinButton.disabled = false;
        spinButton.style.cursor = 'pointer';
    }
});

downButton.addEventListener('click', () => {
    if (!isSpinning) {
        userChoice = 'Down';
        spinButton.disabled = false;
        spinButton.style.cursor = 'pointer';
    }
});

spinButton.addEventListener('click', () => {
    if (!isSpinning && userChoice !== null) {
        spinWheel();
    }
});

drawWheel();
