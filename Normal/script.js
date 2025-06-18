document.addEventListener('DOMContentLoaded', () => {
    let targetNumber = generateRandomNumber();
    const guessGrid = document.getElementById('guess-grid');
    const inputRow = document.getElementById('input-row');
    const messageDisplay = document.getElementById('message');
    
    // Função para obter os inputs da linha de entrada atual
    let getGuessInputs = () => Array.from(inputRow.querySelectorAll('.guess-input'));

    let currentRowIndex = 0; // Para controlar as linhas de palpite

    // Função para aplicar os event listeners aos inputs
    function applyInputListeners(inputs) {
        inputs.forEach((input, index) => {
            const wrapper = input.parentNode;

            // Evento de clique para alternar cor (verde/branco)
            wrapper.removeEventListener('click', toggleGreenClass); // Remove para evitar duplicidade
            wrapper.addEventListener('click', toggleGreenClass);

            function toggleGreenClass() {
                if (!input.readOnly) {
                    wrapper.classList.toggle('green');
                }
            }

            // Evento de input para focar no próximo campo
            input.removeEventListener('input', handleInput); // Remove para evitar duplicidade
            input.addEventListener('input', handleInput);

            function handleInput(event) {
                event.target.value = event.target.value.replace(/[^0-9]/g, '').slice(0, 1);
                if (event.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }

            // Evento de keydown para Enter e Backspace
            input.removeEventListener('keydown', handleKeydown); // Remove para evitar duplicidade
            input.addEventListener('keydown', handleKeydown);

            function handleKeydown(event) {
                const currentInputsInRow = getGuessInputs(); // Pega os inputs da linha atual
                const currentIndexInRow = currentInputsInRow.indexOf(input); // Encontra o índice do input atual na linha

                // Se a tecla for Enter e for o último campo da linha atual
                if (event.key === 'Enter' && currentIndexInRow === 3) {
                    processGuess();
                }

                // Se a tecla for Backspace e o campo estiver vazio e não for o primeiro campo da linha
                if (event.key === 'Backspace' && event.target.value === '' && currentIndexInRow > 0) {
                    currentInputsInRow[currentIndexInRow - 1].focus();
                }
            }
        });
    }

    // Gera um número aleatório de 4 dígitos sem repetição
    function generateRandomNumber() {
        let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let num = '';
        for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            num += digits.splice(randomIndex, 1)[0];
        }
        console.log("Número alvo (para debug):", num); // Apenas para teste, remova em produção
        return num;
    }

    // Processa o palpite do usuário
    function processGuess() {
        const currentInputs = getGuessInputs(); // Pega os inputs da linha de entrada atual
        const userGuessArray = currentInputs.map(input => input.value);
        const userGuess = userGuessArray.join('');

        // Verifica se todos os 4 dígitos foram inseridos
        if (userGuess.length !== 4 || userGuessArray.some(digit => digit === '')) {
            messageDisplay.textContent = "Por favor, digite todos os 4 dígitos.";
            messageDisplay.style.color = "#dc3545"; // Cor vermelha para mensagem de erro
            return;
        }

        messageDisplay.textContent = ""; // Limpa mensagens anteriores

        // Cria a nova linha de palpite na grade
        const currentGuessRowElement = document.createElement('div');
        currentGuessRowElement.classList.add('guess-row');

        let correctPosition = 0;
        let correctNumberWrongPosition = 0;
        const tempTarget = targetNumber.split('');
        const tempGuess = userGuess.split('');

        // Primeiro, verifica as posições corretas (verdes)
        for (let i = 0; i < 4; i++) {
            if (tempGuess[i] === tempTarget[i]) {
                correctPosition++;
                tempGuess[i] = '_'; // Marca como usado no palpite
                tempTarget[i] = '*'; // Marca como usado no alvo
            }
        }

        // Em seguida, verifica os números certos em posições erradas
        for (let i = 0; i < 4; i++) {
            // Verifica se o dígito não foi marcado como '_', ou seja, já não foi contado como posição correta
            // E se o dígito atual do palpite existe no tempTarget (que já teve os 'verdes' removidos/marcados)
            if (tempGuess[i] !== '_' && tempTarget.includes(tempGuess[i])) {
                correctNumberWrongPosition++;
                // Marca o dígito no tempTarget como usado para não contar repetições (importante para lógica tipo Wordle)
                tempTarget[tempTarget.indexOf(tempGuess[i])] = '*';
            }
        }

        // Adiciona os palpites à linha e aplica as cores do usuário
        currentInputs.forEach((inputElement, index) => { // Itera sobre os inputs da linha atual
            const wrapper = document.createElement('div');
            wrapper.classList.add('input-wrapper');
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = '1';
            input.classList.add('guess-input');
            input.value = inputElement.value; // Pega o valor do input atual
            input.readOnly = true; // Torna o campo somente leitura
            wrapper.appendChild(input);
            currentGuessRowElement.appendChild(wrapper);

            // Aplica a classe 'green' se ela estava no wrapper original
            if (inputElement.parentNode.classList.contains('green')) {
                wrapper.classList.add('green');
            }
        });


        // Cria o elemento para a dica
        const hintSpan = document.createElement('span');
        hintSpan.classList.add('hint-text');
        hintSpan.style.marginLeft = '15px'; // Espaçamento da dica

        if (correctPosition === 4) {
            messageDisplay.textContent = "Parabéns! Você acertou o número!";
            messageDisplay.style.color = "#28a745"; // Cor verde para mensagem de sucesso
            hintSpan.textContent = "Parabéns!"; // Dica final
            
            // Garante que a última resposta seja verde
            currentGuessRowElement.querySelectorAll('.input-wrapper').forEach(wrapper => {
                wrapper.classList.add('green');
            });

            // Desabilita os inputs para novos palpites
            currentInputs.forEach(input => {
                input.disabled = true;
                input.readOnly = true;
            });
            
            // Impede a criação de uma nova linha de inputs se o jogo acabou
            inputRow.innerHTML = ''; 

        } else {
            let hintMessage = "";
            if (correctPosition > 0 && correctNumberWrongPosition > 0) {
                hintMessage = `${correctPosition} número(s) certo(s) no lugar(es) certo(s) e ${correctNumberWrongPosition} número(s) certo(s) no(s) lugar(es) errado(s).`;
            } else if (correctPosition > 0) {
                hintMessage = `${correctPosition} número(s) certo(s) no lugar(es) certo(s).`;
            } else if (correctNumberWrongPosition > 0) {
                hintMessage = `${correctNumberWrongPosition} número(s) certo(s) no(s) lugar(es) errado(s).`;
            } else {
                hintMessage = "Todos os números errados.";
            }
            hintSpan.textContent = hintMessage;
            currentRowIndex++; // Incrementa o índice da linha

            // Limpa e recria a linha de input para a próxima tentativa
            inputRow.innerHTML = `
                <div class="input-wrapper"><input type="text" maxlength="1" class="guess-input" data-index="0"></div>
                <div class="input-wrapper"><input type="text" maxlength="1" class="guess-input" data-index="1"></div>
                <div class="input-wrapper"><input type="text" maxlength="1" class="guess-input" data-index="2"></div>
                <div class="input-wrapper"><input type="text" maxlength="1" class="guess-input" data-index="3"></div>
            `;
            // Re-seleciona os inputs recém-criados e reaplica os listeners
            applyInputListeners(getGuessInputs());
            getGuessInputs()[0].focus(); // Foca no primeiro input da nova linha
        }

        currentGuessRowElement.appendChild(hintSpan); // Adiciona a dica à linha de palpite
        guessGrid.appendChild(currentGuessRowElement);
    }

    // Inicializa os event listeners para os inputs da primeira linha
    applyInputListeners(getGuessInputs());
    getGuessInputs()[0].focus(); // Foca no primeiro input
});