const wheelCanvas = document.getElementById('wheelCanvas');
const ctx = wheelCanvas.getContext('2d');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const spinButton = document.getElementById('spinButton');
const winMessage = document.getElementById('winMessage');
const ucoinDisplay = document.querySelector('.coin-balance');
const betInput = document.getElementById('betInput');
// const loginModal = document.getElementById('loginModal');
// const loginButton = document.getElementById('loginButton');
// const loginErrorMessage = document.getElementById('loginErrorMessage');
const gameContainer = document.querySelector('.container');

let ucoins = parseInt(localStorage.getItem('ucoins')) || 0; // Load coin balance from localStorage

function updateCoinBalance() {
    localStorage.setItem('ucoins', ucoins); // Update localStorage whenever coins change
    ucoinDisplay.innerText = `${ucoins.toFixed(2)} Ucoin`; // Update the displayed balance
}

const segments = ['Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down', 'Up', 'Down'];
const alternateColors = ['#FFD700', '#FF0000', '#FFD700', '#FF0000', '#FFD700', '#FF0000', '#FFD700', '#FF0000'];
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080']; // Vibrant colors

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

// loginModal.classList.add('show-modal');

// localStorage.setItem('isLoggedIn', true);
//     window.onload = () => {
//         const isLoggedIn = localStorage.getItem('isLoggedIn');
//         if (isLoggedIn) {
//             loginModal.style.display = 'none';
//             gameContainer.style.filter = 'none';
//             checkDailyReward();
//             updateCoinBalance();
//         }
//     };




// Call this function to set the initial balance when the page loads
updateCoinBalance();

function updateCoinBalance() {
    localStorage.setItem('ucoins', ucoins);
    ucoinDisplay.innerText = `${ucoins.toFixed(2)} Ucoin`;
}

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

        if (ctx.fillStyle === '#FFD700') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF0000';
        }

        ctx.fill();
        ctx.save();

        ctx.translate(wheelRadius, wheelRadius);
        ctx.rotate(angle + arcSize / 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(segment, 60, 10);
        ctx.restore();
    });

    ctx.shadowBlur = 0;
}


function spinWheel() {
    if (isSpinning || userChoice === null) {
        return;
    }

    betAmount = parseInt(betInput.value, 10);

    if (isNaN(betAmount) || betAmount <= 0 || betAmount > ucoins) {
        winMessage.innerText = "Please enter a valid bet amount.";
        isSpinning = false;
        clearInterval(spinSoundInterval);
        return;
    }

    isSpinning = true;
    winMessage.innerText = "";

    spinSound.currentTime = 0;
    spinSound.volume = 1;
    spinSound.playbackRate = 1;
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
        spinSound.playbackRate = 1 - easedProgress * 0.7;
        spinSound.volume = 1 - easedProgress;

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
        ucoins += betAmount;
        message = ` You won ${betAmount} Ucoins!🎁`;
        isWin = true;
        
        // Play win sound
        winSound.play();
    } else {
        // Player loses, deduct the bet amount and prepare the lose message
        ucoins -= betAmount;
        message = `🙁You Lose ${betAmount} Ucoins.`;
        
        // Play lose sound
        loseSound.play();
    }
    
    // Update the displayed coin balance
    updateCoinBalance();

    // Set the dynamic win message
   

    // Show the result modal with the prepared message
    showResultModal(message);

    // Scroll to the winMessage for visibility
    winMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Reset the user choice and disable the spin button until they make a new choice
    userChoice = null;
    spinButton.disabled = true;
    spinButton.style.cursor = 'not-allowed';
}

function showDailyRewardMessage() {
    const rewardMessageElement = document.getElementById('dailyRewardMessage');
    rewardMessageElement.style.display = 'block';

    setTimeout(() => {
        rewardMessageElement.classList.add('fade-out');
        setTimeout(() => {
            rewardMessageElement.style.display = 'none';
            rewardMessageElement.classList.remove('fade-out');
        }, 1000);
    }, 3000);
}

function checkDailyReward() {
    const lastLoginDate = localStorage.getItem('lastLoginDate');
    const today = new Date().toISOString().split('T')[0];

   
}

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

// const validUsername = 'khizar';
// const validPassword = '123';

// loginButton.addEventListener('click', () => {
//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;

//     if (username === validUsername && password === validPassword) {
//         // Hide login modal
//         loginModal.style.display = 'none';
//         gameContainer.style.filter = 'none';

//         // Retrieve existing citizens from local storage or initialize it
//         let citizens = JSON.parse(localStorage.getItem('citizens')) || [];
        
//         // Assign the next available citizen number
//         let citizenNumber = citizens.length + 1;
//         citizens.push(citizenNumber); // Add this citizen to the list
//         localStorage.setItem('citizens', JSON.stringify(citizens)); // Save updated citizens array

//         // Display citizen count
//         const citizenDisplay = document.getElementById('citizenDisplay');
//         citizenDisplay.innerText = `${citizenNumber} citizen${citizenNumber > 1 ? 's' : ''}`;

//         checkDailyReward();
//         updateCoinBalance();
//     } else {
//         loginErrorMessage.classList.remove('show');
//         setTimeout(() => {
//             loginErrorMessage.innerText = 'Invalid username or password. Please try again.';
//             loginErrorMessage.classList.add('show');
//         }, 100);
//     }
// });

// window.onload = function() {
//     const citizens = JSON.parse(localStorage.getItem('citizens')) || [];
//     const citizenDisplay = document.getElementById('citizenDisplay');
//     const citizenNumber = citizens.length; // Count of logged in citizens
//     citizenDisplay.innerText = `${citizenNumber} citizen${citizenNumber > 1 ? 's' : ''}`;
// };

// function logout() {
//     let citizens = JSON.parse(localStorage.getItem('citizens')) || [];
//     if (citizens.length > 0) {
//         citizens.pop(); // Remove the last logged in citizen
//         localStorage.setItem('citizens', JSON.stringify(citizens)); // Save updated citizens array
//     }
//     // Optionally reset the display
//     const citizenDisplay = document.getElementById('citizenDisplay');
//     const citizenNumber = citizens.length; // Update citizen count
//     citizenDisplay.innerText = `${citizenNumber} citizen${citizenNumber > 1 ? 's' : ''}`;
// }

// Use localStorage to track the number of users
let citizenNumber = localStorage.getItem('citizenNumber') || 0;
citizenNumber++;
localStorage.setItem('citizenNumber', citizenNumber);

// Display the citizen count somewhere in your UI
const citizenDisplay = document.getElementById('citizenCount');
citizenDisplay.innerText = `Citizen #${citizenNumber}`;


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
        // Reward the user with coins
        ucoins += DAILY_REWARD; // Add your daily reward amount
        localStorage.setItem(`lastReward_${userIP}`, today); // Update the last reward date
        updateCoinBalance(); // Function to update the display
        showDailyRewardMessage(); // Show a message for the reward
    }
}

// Call the function when the page loads
window.onload = checkAndRewardCoins;

if (!sessionStorage.getItem(`rewarded_${userIP}`)) {
    // Reward the user
    ucoins += DAILY_REWARD;
    sessionStorage.setItem(`rewarded_${userIP}`, 'true'); // Mark that they have been rewarded
    updateCoinBalance();
}


