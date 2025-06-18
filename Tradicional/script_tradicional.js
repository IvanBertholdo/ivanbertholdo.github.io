document.addEventListener('DOMContentLoaded', () => {
    let targetNumber = generateRandomNumber();
    let currentGuessRow = null; // Armazena a linha de input atual
    const guessGrid = document.getElementById('guess-grid');
    const inputRow = document.getElementById('input-row');
    const messageDisplay = document.getElementById('message');
    const guessInputs = Array.from(document.querySelectorAll('.guess-input'));

    // Adiciona o evento de input para focar no próximo campo
    guessInputs.forEach((input, index) => {
        input.addEventListener('input', (event) => {
            // Permite apenas um dígito numérico
            event.target.value = event.target.value.replace(/[^0-9]/g, '').slice(0, 1);
            if (event.target.value.length === 1 && index < guessInputs.length - 1) {
                guessInputs[index + 1].focus();
            }
        });

        // Adiciona o evento de keydown para detectar Enter no último campo
        // E para voltar com Backspace em campos vazios
        input.addEventListener('keydown', (event) => {
            // Se a tecla for Enter e for o último campo
            if (event.key === 'Enter' && index === guessInputs.length - 1) {
                processGuess();
            }

            // Se a tecla for Backspace e o campo estiver vazio e não for o primeiro campo
            if (event.key === 'Backspace' && event.target.value === '' && index > 0) {
                guessInputs[index - 1].focus();
            }
        });
    });

    // Gera um número aleatório de 4 dígitos sem repetição
    function generateRandomNumber() {
        let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let num = '';
        for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            num += digits[randomIndex];
            digits.splice(randomIndex, 1); // Remove o dígito escolhido para evitar repetição
        }
        console.log("Número alvo (para debug):", num); // Apenas para teste, remova em produção
        return num;
    }

    // Processa o palpite do usuário
    function processGuess() {
        const userGuessArray = guessInputs.map(input => input.value);
        const userGuess = userGuessArray.join('');

        // Verifica se todos os 4 dígitos foram inseridos
        if (userGuess.length !== 4 || userGuessArray.some(digit => digit === '')) {
            messageDisplay.textContent = "Por favor, digite todos os 4 dígitos.";
            messageDisplay.style.color = "#dc3545"; // Cor vermelha para mensagem de erro
            return;
        }

        messageDisplay.textContent = ""; // Limpa mensagens anteriores

        // Clona a linha de input atual para a grade de palpites e aplica as cores
        const currentGuessRowElement = inputRow.cloneNode(true);
        currentGuessRowElement.removeAttribute('id'); // Remove o ID para não duplicar
        currentGuessRowElement.classList.add('guess-row');

        const clonedInputs = Array.from(currentGuessRowElement.querySelectorAll('.guess-input'));
        let correctCount = 0;

        clonedInputs.forEach((input, index) => {
            const guessedDigit = userGuess[index];
            const targetDigit = targetNumber[index];

            input.value = guessedDigit; // Define o valor do input clonado
            input.readOnly = true; // Torna o campo somente leitura

            if (guessedDigit === targetDigit) {
                input.classList.add('green');
                correctCount++;
            } else if (targetNumber.includes(guessedDigit)) {
                input.classList.add('yellow');
            } else {
                input.classList.add('red');
            }
        });

        guessGrid.appendChild(currentGuessRowElement);

        // Verifica se o usuário acertou
        if (correctCount === 4) {
            messageDisplay.textContent = "Parabéns! Você acertou o número!";
            messageDisplay.style.color = "#28a745"; // Cor verde para mensagem de sucesso
            // Desabilita os inputs para novos palpites
            guessInputs.forEach(input => {
                input.disabled = true;
            });
            return;
        }

        // Prepara para o próximo palpite: limpa os inputs e foca no primeiro
        guessInputs.forEach(input => {
            input.value = '';
            input.classList.remove('green', 'yellow', 'red'); // Garante que a próxima linha esteja em branco
        });
        guessInputs[0].focus();
    }

    // Inicializa a primeira linha de inputs (já está no HTML, mas garantimos o foco)
    guessInputs[0].focus();
});