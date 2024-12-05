function setupPlaceholders() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    editableElements.forEach(element => {
        if (element.classList.contains('typing-area')) return; // Skip typing area

        element.innerHTML = element.getAttribute('data-placeholder');
        element.classList.add('placeholder');
        
        element.addEventListener('focus', function() {
            if (this.innerHTML === this.getAttribute('data-placeholder')) {
                this.innerHTML = '';
                this.classList.remove('placeholder');
            }
        });
        
        element.addEventListener('blur', function() {
            if (this.innerHTML === '') {
                this.innerHTML = this.getAttribute('data-placeholder');
                this.classList.add('placeholder');
            }
        });
    });
}

function addLines() {
    const linesDiv = document.querySelector('.linesdiv');
    for (let i = 0; i < 18; i++) { // Change from 15 to 18
        const line = document.createElement('div');
        line.classList.add('line');
        linesDiv.appendChild(line);
    }
}

function setupTypingArea() {
    const typingArea = document.querySelector('.typing-area');
    const lines = document.querySelectorAll('.line');

    function updateLines() {
        const range = document.createRange();
        const lineHeight = parseInt(window.getComputedStyle(typingArea).lineHeight);
        let lineIndex = 0;
        let lastBottom = 0;

        Array.from(typingArea.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLines = node.textContent.split('\n');
                textLines.forEach((line, index) => {
                    if (line.trim() !== '' || index > 0) {
                        lines[lineIndex].style.opacity = '1';
                        lineIndex++;
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                range.selectNode(node);
                const rect = range.getBoundingClientRect();
                if (rect.top >= lastBottom) {
                    lines[lineIndex].style.opacity = '1';
                    lineIndex++;
                    lastBottom = rect.bottom;
                }
            }
        });

        // Hide remaining lines
        for (let i = lineIndex; i < lines.length; i++) {
            lines[i].style.opacity = '0';
        }
    }

    typingArea.addEventListener('input', updateLines);
    typingArea.addEventListener('paste', () => setTimeout(updateLines, 0));

    // Initial update
    updateLines();

    // Expose updateLines function
    typingArea.updateLines = updateLines;
}

function createNoteButtons() {
    const container = document.querySelector('.note-buttons-container');
    const notes = [
        'A3', 'As3', 'B3', 
        'C4', 'Cs4', 'D4', 'Ds4', 'E4', 'F4', 'Fs4', 'G4', 'Gs4', 'A4', 'As4', 'B4',
        'C5', 'Cs5', 'D5', 'Ds5', 'E5', 'F5', 'Fs5', 'G5', 'Gs5', 'A5', 'As5', 'B5',
        'C6', 'Cs6', 'D6', 'Ds6', 'E6', 'F6', 'Fs6', 'G6'
    ];

    notes.forEach(note => {
        const button = document.createElement('div');
        button.classList.add('note-button');

        const img = document.createElement('img');
        img.src = `noteimg/${note}_image.jpg`;
        img.alt = note;
        img.classList.add('note-image');

        const name = document.createElement('div');
        name.textContent = note.replace('s', '#');
        name.classList.add('note-name');

        button.appendChild(img);
        button.appendChild(name);
        button.addEventListener('click', () => insertNoteSVG(note));
        container.appendChild(button);
    });
}

function insertNoteSVG(note) {
    const typingArea = document.querySelector('.typing-area');
    
    // Ensure the typing area is focused
    typingArea.focus();

    // Get the current selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    fetch(`svgs/${note}.svg`)
        .then(response => response.text())
        .then(svgContent => {
            // Create a span to wrap the SVG
            const wrapper = document.createElement('span');
            wrapper.contentEditable = 'false';
            wrapper.style.display = 'inline-block';
            wrapper.style.verticalAlign = 'middle';
            wrapper.style.margin = '0 2px';

            // Parse the SVG content
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            // Set some default styling for the SVG
            svgElement.setAttribute('width', '30');
            svgElement.setAttribute('height', '45');

            // Append SVG to the wrapper
            wrapper.appendChild(svgElement);

            // Insert the wrapper at the current cursor position
            range.deleteContents();
            range.insertNode(wrapper);

            // Move cursor after the inserted SVG
            range.setStartAfter(wrapper);
            range.setEndAfter(wrapper);
            selection.removeAllRanges();
            selection.addRange(range);

            // Trigger the input event to update the gray lines
            typingArea.dispatchEvent(new Event('input'));
        })
        .catch(error => console.error('Error loading SVG:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    setupPlaceholders();
    addLines();
    setupTypingArea();
    createNoteButtons();
});

document.getElementById('export-png').addEventListener('click', function() {
    const comparea = document.getElementById('comparea');

    // Use html2canvas to capture the comparea
    html2canvas(comparea, { 
        scale: 2, // Higher scale for better resolution
        useCORS: true, // Allow cross-origin images
    }).then(canvas => {
        // Convert canvas to a PNG image
        const pngURL = canvas.toDataURL('image/png');

        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = 'comparea.png';
        document.body.appendChild(downloadLink);

        // Programmatically click the link to trigger download
        downloadLink.click();

        // Remove the link from the DOM
        document.body.removeChild(downloadLink);
    }).catch(error => {
        console.error('Error exporting as PNG:', error);
    });
});