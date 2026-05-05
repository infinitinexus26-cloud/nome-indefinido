// Handle comment form submission
document.getElementById('comment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const text = document.getElementById('comment-text').value;
    const photoInput = document.getElementById('comment-photo');
    const photoFile = photoInput.files[0];

    const comment = { rating: parseInt(rating), text: text, photo: null };
    
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            comment.photo = event.target.result;
            saveComment(comment);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveComment(comment);
    }
});

function saveComment(comment) {
    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    comments.push(comment);
    localStorage.setItem('comments', JSON.stringify(comments));

    document.getElementById('comment-text').value = '';
    document.getElementById('comment-photo').value = null;
    document.querySelector('input[name="rating"]:checked').checked = false;
    document.getElementById('star0').checked = true;
    
    loadComments();
}

// Load and display comments
function loadComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    const comments = JSON.parse(localStorage.getItem('comments')) || [];
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment';
        let html = `
            <div class="stars">${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</div>
        `;
        if (comment.photo) {
            html += `<img src="${comment.photo}" alt="Foto" style="max-width: 300px; border-radius: 8px; margin: 10px 0;">`;
        }
        html += `<p>${comment.text}</p>`;
        div.innerHTML = html;
        commentsList.appendChild(div);
    });
}

// Handle rental form submission
document.getElementById('rental-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Check if date is available
    if (!rentalManager.isDateAvailable('pula_pula', date)) {
        alert('❌ Desculpe! Esta data não está disponível para aluguel.\n\nEscolha outra data ou entre em contato conosco.');
        return;
    }
    
    // Build WhatsApp message
    const whatsappMessage = `Olá! Gostaria de alugar Pula Pula\n\nInformações do aluguel:\n- Nome: ${name}\n- Data do evento: ${date}\n- Telefone: ${phone}\n- Email: ${email}\n- Mensagem: ${message || 'Nenhuma mensagem adicional'}`;
    
    // Store rental and block date
    rentalManager.addRental('pula_pula', date, {
        name: name,
        phone: phone,
        email: email,
        message: message
    });
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Show success message
    alert('✅ Data bloqueada com sucesso! Você será redirecionado para o WhatsApp.');
    
    // Redirect to WhatsApp
    window.location.href = `https://wa.me/5521975600493?text=${encodedMessage}`;
    
    // Clear form
    this.reset();
});

// Carousel functionality
let currentSlideIndex = 0;
const slides = document.querySelector('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');

function updateCarousel() {
    slides.style.transform = `translateX(-${currentSlideIndex * 25}%)`;
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlideIndex);
    });
}

function moveSlide(direction) {
    currentSlideIndex = (currentSlideIndex + direction + 4) % 4;
    updateCarousel();
}

function currentSlide(index) {
    currentSlideIndex = index;
    updateCarousel();
}

// Auto-play carousel
setInterval(() => {
    moveSlide(1);
}, 5000);

// Initialize carousel
updateCarousel();

// Load comments on page load
loadComments();