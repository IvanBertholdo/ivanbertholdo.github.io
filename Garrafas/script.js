document.addEventListener('DOMContentLoaded', () => {
    const bottlePlayArea = document.getElementById('bottle-play-area');
    const confirmGuessBtn = document.getElementById('confirm-guess-btn');
    const resultModal = document.getElementById('result-modal');
    const closeButton = resultModal.querySelector('.close-button');
    const modalMessage = document.getElementById('modal-message');

    const colors = [
        { name: 'Azul', hex: '#007bff' },
        { name: 'Verde', hex: '#28a745' },
        { name: 'Vermelho', hex: '#dc3545' },
        { name: 'Amarelo', hex: '#ffc107' },
        { name: 'Preto', hex: '#343a40' },
        { name: 'Rosa', hex: '#ffcbdb' },
        { name: 'Laranja', hex: '#fd7e14' },
        { name: 'Roxo', hex: '#6f42c1' }
    ];

    let secretCombination = [];
    let currentBottles = [];

    // --- Funções de Inicialização ---

    function generateSecretCombination() {
        const shuffledColors = [...colors];
        for (let i = shuffledColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j], shuffledColors[i]];
        }
        secretCombination = shuffledColors.slice(0, 8);
        console.log("Combinação Secreta (para debug):", secretCombination.map(c => c.name));
    }

    async function loadBottleSVG() {
        try {
            const response = await fetch('../assets/garrafa.svg');
            const svgText = await response.text();
            
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
            
            return svgDoc.documentElement;
        } catch (error) {
            console.error("Erro ao carregar ou analisar SVG da garrafa:", error);
            const parser = new DOMParser();
            return parser.parseFromString('<svg viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="gray"/></svg>', "image/svg+xml").documentElement;
        }
    }

    let bottleSVGElement = null;

    async function initializeGame() {
        generateSecretCombination();
        bottleSVGElement = await loadBottleSVG();
        createInitialBottles();
        addDragAndDropListeners();
    }

    function createInitialBottles() {
        bottlePlayArea.innerHTML = '';
        currentBottles = [];

        const initialDisplayColors = [...colors];
        for (let i = initialDisplayColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialDisplayColors[i], initialDisplayColors[j]] = [initialDisplayColors[j], initialDisplayColors[i]];
        }

        initialDisplayColors.forEach((colorData, index) => {
            const bottleItem = document.createElement('div');
            bottleItem.classList.add('bottle-item');
            bottleItem.setAttribute('draggable', 'true');
            bottleItem.dataset.colorName = colorData.name;

            const clonedSVGElement = bottleSVGElement.cloneNode(true);
            
            const colorablePart = clonedSVGElement.querySelector('path') || clonedSVGElement.querySelector('rect') || clonedSVGElement;
            if (colorablePart) {
                colorablePart.setAttribute('fill', colorData.hex);
            }

            bottleItem.appendChild(clonedSVGElement);
            bottlePlayArea.appendChild(bottleItem);
            
            currentBottles.push({
                id: `bottle-${colorData.name}`,
                color: colorData.hex,
                name: colorData.name,
                element: bottleItem
            });
        });
    }

    // --- Lógica de Arrastar e Soltar (Drag and Drop) ---
    let draggedItem = null;
    let originalIndex = -1; // Para guardar a posição original do item arrastado

    function addDragAndDropListeners() {
        bottlePlayArea.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.bottle-item');
            if (draggedItem) {
                draggedItem.classList.add('dragging');
                originalIndex = Array.from(bottlePlayArea.children).indexOf(draggedItem); // Guarda o índice original
                // Use setTimeout para evitar que o ghost image do arrasto inclua o espaço original
                setTimeout(() => {
                    draggedItem.style.visibility = 'hidden'; // Esconde para um efeito de "levando"
                }, 0);
                e.dataTransfer.setData('text/plain', draggedItem.dataset.colorName);
            }
        });

        bottlePlayArea.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.style.visibility = 'visible'; // Torna visível novamente
                draggedItem.classList.remove('dragging');
                draggedItem = null;
                originalIndex = -1;
            }
            updateCurrentBottlesOrder(); // Atualiza a ordem final no array JS
        });

        bottlePlayArea.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessário para permitir o drop
            const target = e.target.closest('.bottle-item');

            // APENAS REORDENA SE ESTIVER ARRASTANDO UM ITEM VÁLIDO E SOBRE OUTRO ITEM VÁLIDO E DIFERENTE
            if (draggedItem && target && target !== draggedItem) {
                const currentChildren = Array.from(bottlePlayArea.children);
                const draggedIndex = currentChildren.indexOf(draggedItem);
                const targetIndex = currentChildren.indexOf(target);

                if (draggedIndex === -1 || targetIndex === -1) return; // Se por algum motivo não encontrar os índices

                // Lógica de "troca": Remove o draggedItem da posição original e insere na nova posição do target,
                // e move o target para a posição original do draggedItem.
                // Isso cria o efeito visual de troca.

                // Remove o draggedItem temporariamente do DOM para inseri-lo em outro lugar
                bottlePlayArea.removeChild(draggedItem);

                if (draggedIndex < targetIndex) {
                    // Arrastando para a direita: insere o draggedItem APÓS o target
                    bottlePlayArea.insertBefore(draggedItem, target.nextSibling);
                } else {
                    // Arrastando para a esquerda: insere o draggedItem ANTES do target
                    bottlePlayArea.insertBefore(draggedItem, target);
                }
            }
        });

        bottlePlayArea.addEventListener('drop', (e) => {
            e.preventDefault();
            // A ordem já foi manipulada no dragover, apenas garante que o item solto é visível
            if (draggedItem) {
                draggedItem.style.visibility = 'visible';
                draggedItem.classList.remove('dragging');
            }
            updateCurrentBottlesOrder(); // Garante que o array currentBottles está sincronizado com o DOM
        });
    }

    // Atualiza a ordem do array currentBottles com base na ordem DOM
    // Esta função é chamada após dragend e drop
    function updateCurrentBottlesOrder() {
        const orderedBottleElements = Array.from(bottlePlayArea.children);
        currentBottles = orderedBottleElements.map(el => {
            const colorName = el.dataset.colorName;
            const colorData = colors.find(c => c.name === colorName);
            return {
                id: `bottle-${colorName}`,
                color: colorData.hex,
                name: colorData.name,
                element: el
            };
        });
    }

    // --- Lógica de Verificação de Palpite e Modal ---

    confirmGuessBtn.addEventListener('click', checkGuess);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === resultModal) {
            closeModal();
        }
    });

    function checkGuess() {
        const guessedCombinationNames = currentBottles.map(b => b.name);
        const secretCombinationNames = secretCombination.map(c => c.name);

        let correctCount = 0;

        for (let i = 0; i < guessedCombinationNames.length; i++) {
            if (guessedCombinationNames[i] === secretCombinationNames[i]) {
                correctCount++;
            }
        }

        let message = '';
        if (correctCount === colors.length) {
            message = "Parabéns! Você acertou a combinação!";
            confirmGuessBtn.textContent = "Jogar Novamente";
            confirmGuessBtn.removeEventListener('click', checkGuess); // Remove o listener antigo
            confirmGuessBtn.addEventListener('click', resetGame); // Adiciona o novo listener
        } else if (correctCount === 0) {
            message = `Nenhum acerto`;
        } else if (correctCount === 1) {
            message = `${correctCount} acerto`;
        } else {
            message = `${correctCount} acertos`;
        }

        showModal(message);
    }

    function showModal(msg) {
        modalMessage.textContent = msg;
        resultModal.style.display = 'flex';
    }

    function closeModal() {
        resultModal.style.display = 'none';
    }

    // --- Nova Função: Resetar o Jogo ---
    function resetGame() {
        closeModal(); // Fecha o modal, se estiver aberto
        generateSecretCombination(); // Gera uma nova combinação secreta
        createInitialBottles(); // Recria as garrafas na área de jogo (embaralhadas)
        
        // Redefine o botão para seu estado original
        confirmGuessBtn.textContent = "Confirmar Palpite";
        confirmGuessBtn.disabled = false; // Habilita o botão
        confirmGuessBtn.removeEventListener('click', resetGame); // Remove o listener de reset
        confirmGuessBtn.addEventListener('click', checkGuess); // Adiciona o listener de checagem novamente
    }

    // Início do Jogo
    initializeGame();
});