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
    let comments = JSON.parse(localStorage.getItem('comments-cadeiras')) || [];
    comments.push(comment);
    localStorage.setItem('comments-cadeiras', JSON.stringify(comments));

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
    
    const comments = JSON.parse(localStorage.getItem('comments-cadeiras')) || [];
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
    const chairs = parseInt(document.getElementById('chairs').value);
    const tables = parseInt(document.getElementById('tables').value);
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Check availability
    const availability = rentalManager.checkAvailability('cadeiras', date, chairs, tables);
    if (!availability.available) {
        alert(`❌ Desculpe! Quantidade insuficiente disponível para esta data.\n\nDisponível:\n- Cadeiras: ${availability.availableChairs}\n- Mesas: ${availability.availableTables}\n\nEscolha quantidades menores ou outra data.`);
        return;
    }
    
    // Calculate prices (example prices)
    const chairPrice = 5.00; // R$ 5,00 por cadeira
    const tablePrice = 15.00; // R$ 15,00 por mesa
    const totalPrice = (chairs * chairPrice) + (tables * tablePrice);
    
    // Build rental items
    const items = [];
    if (chairs > 0) {
        items.push({
            name: 'Cadeira',
            service: 'Cadeiras',
            quantity: chairs,
            price: chairPrice,
            total: chairs * chairPrice
        });
    }
    if (tables > 0) {
        items.push({
            name: 'Mesa',
            service: 'Cadeiras',
            quantity: tables,
            price: tablePrice,
            total: tables * tablePrice
        });
    }
    
    // Store rental as pending
    const rentalId = rentalManager.addRentalWithQuantity('cadeiras', date, {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        message: message,
        chairs: chairs,
        tables: tables,
        items: items,
        totalPrice: totalPrice
    });
    
    // Build WhatsApp message
    const whatsappMessage = `Olá! Gostaria de alugar Cadeiras e Mesas\n\nInformações do aluguel:\n- Nome: ${name}\n- Data do evento: ${date}\n- Cadeiras: ${chairs} x R$ ${chairPrice.toFixed(2)} = R$ ${(chairs * chairPrice).toFixed(2)}\n- Mesas: ${tables} x R$ ${tablePrice.toFixed(2)} = R$ ${(tables * tablePrice).toFixed(2)}\n- Total: R$ ${totalPrice.toFixed(2)}\n- Telefone: ${phone}\n- Email: ${email}\n- Mensagem: ${message || 'Nenhuma mensagem adicional'}\n\nCódigo do pedido: ${rentalId}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Show success message
    alert('✅ Solicitação enviada! Aguarde a confirmação do administrador. Você será redirecionado para o WhatsApp.');
    
    // Redirect to WhatsApp
    window.location.href = `https://wa.me/5521975600493?text=${encodedMessage}`;
    
    this.reset();
    updateRentalSummary(date);
});

function updateRentalSummary(date) {
    const summary = document.getElementById('rental-summary');
    if (!summary) return;

    if (!date) {
        summary.innerHTML = '<p>Selecione uma data para ver itens já alugados.</p>';
        return;
    }

    const rentals = rentalManager.getRentals('cadeiras').filter(rental => rental.date === date);
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (rentals.length === 0) {
        summary.innerHTML = `
            <h3>Itens alugados em ${formattedDate}</h3>
            <p>Nenhum item alugado para esta data.</p>
        `;
        return;
    }

    let html = `
        <h3>Itens alugados em ${formattedDate}</h3>
        <ul class="rental-summary-list">
    `;

    rentals.forEach(rental => {
        html += `
            <li>
                <strong>${rental.info.customerName}</strong> - Cadeiras: ${rental.info.chairs || 0}, Mesas: ${rental.info.tables || 0} <br>
                Total: R$ ${Number(rental.info.totalPrice || 0).toFixed(2)}${rental.info.itemCode ? ` - Código: ${rental.info.itemCode}` : ''}
            </li>
        `;
    });

    html += '</ul>';
    summary.innerHTML = html;
}

document.getElementById('date').addEventListener('change', function() {
    updateRentalSummary(this.value);
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

setInterval(() => {
    moveSlide(1);
}, 5000);

updateCarousel();

// Load comments on page load
loadComments();