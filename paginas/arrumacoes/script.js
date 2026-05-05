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
    let comments = JSON.parse(localStorage.getItem('comments-arrumacoes')) || [];
    comments.push(comment);
    localStorage.setItem('comments-arrumacoes', JSON.stringify(comments));

    document.getElementById('comment-text').value = '';
    document.getElementById('comment-photo').value = null;
    document.querySelector('input[name="rating"]:checked').checked = false;
    document.getElementById('star0').checked = true;
    
    loadComments();
}

const commentPhotoInput = document.getElementById('comment-photo');
if (commentPhotoInput) {
    commentPhotoInput.addEventListener('change', function() {
        if (this.files.length) {
            alert('Por favor, não envie imagens inapropriadas ou ofensivas. Use esta foto apenas para mostrar sua arrumação.');
        }
    });
}

// Load and display comments
function loadComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    const comments = JSON.parse(localStorage.getItem('comments-arrumacoes')) || [];
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
            <div class="stars">${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</div>
            <p>${comment.text}</p>
            ${comment.photo ? `<img class="comment-photo" src="${comment.photo}" alt="Foto da arrumação">` : ''}
        `;
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
    const selectedArrumacao = document.getElementById('selected-arrumacao').value;
    
    // Check if date is available
    if (!rentalManager.isDateAvailable('arrumacoes', date)) {
        alert('❌ Desculpe! Esta data não está disponível para aluguel.\n\nEscolha outra data ou entre em contato conosco.');
        return;
    }
    
    // Build WhatsApp message
    const whatsappMessage = `Olá! Gostaria de solicitar Arrumação\n\nInformações do serviço:\n- Nome: ${name}\n- Data do evento: ${date}\n- Arrumação ID: ${selectedArrumacao}\n- Telefone: ${phone}\n- Email: ${email}\n- Mensagem: ${message || 'Nenhuma mensagem adicional'}`;
    
    // Store rental and block date
    rentalManager.addRental('arrumacoes', date, {
        name: name,
        phone: phone,
        email: email,
        message: message,
        arrumacaoId: selectedArrumacao,
        itemDescription: selectedArrumacao
    });
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Show success message
    alert('✅ Data bloqueada com sucesso! Você será redirecionado para o WhatsApp.');
    
    // Redirect to WhatsApp
    window.location.href = `https://wa.me/5521975600493?text=${encodedMessage}`;
    
    // Clear form
    this.reset();
    updateArrumacaoSummary(date);
});

function updateArrumacaoSummary(date) {
    const summary = document.getElementById('rental-summary');
    if (!summary) return;

    if (!date) {
        summary.innerHTML = '<p>Selecione uma data para ver arrumações já alugadas.</p>';
        return;
    }

    const rentals = rentalManager.getRentals('arrumacoes').filter(rental => rental.date === date);
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (rentals.length === 0) {
        summary.innerHTML = `
            <h3>Arrumações alugadas em ${formattedDate}</h3>
            <p>Nenhuma arrumação marcada para esta data.</p>
        `;
        return;
    }

    let html = `
        <h3>Arrumações alugadas em ${formattedDate}</h3>
        <ul class="rental-summary-list">
    `;

    rentals.forEach(rental => {
        html += `
            <li>
                <strong>${rental.info.name}</strong> - Arrumação: ${rental.info.arrumacaoId || '---'}<br>
                Email: ${rental.info.email}<br>
                Observação: ${rental.info.message || 'Nenhuma'}
            </li>
        `;
    });

    html += '</ul>';
    summary.innerHTML = html;
}

document.getElementById('date').addEventListener('change', function() {
    updateArrumacaoSummary(this.value);
});

function maybeInitArrumacaoSummary() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        updateArrumacaoSummary(dateInput.value);
    }
}

// Load arrumações from localStorage
function loadArrumacoes() {
    const arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
    const selectElement = document.getElementById('arrumacao-select');
    const contentContainer = document.getElementById('arrumacao-content');
    
    // Clear existing options except the first one
    selectElement.innerHTML = '<option value="">Selecione uma arrumação...</option>';
    
    if (arrumacoes.length === 0) {
        selectElement.innerHTML = '<option value="">Nenhuma arrumação disponível</option>';
        contentContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma arrumação disponível no momento.</p>';
        return;
    }
    
    // Add options to select
    arrumacoes.forEach((arrumacao, index) => {
        const option = document.createElement('option');
        option.value = arrumacao.id;
        option.textContent = `${arrumacao.title} - R$ ${arrumacao.price.toFixed(2)}`;
        selectElement.appendChild(option);
    });
    
    // Set default content (first arrumacao)
    if (arrumacoes.length > 0) {
        showArrumacaoContent(arrumacoes[0]);
        document.getElementById('selected-arrumacao').value = arrumacoes[0].id;
        updateCarouselWithArrumacao(arrumacoes[0]);
    }
    
    // Add change event listener
    selectElement.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            const selectedArrumacao = arrumacoes.find(arr => arr.id === selectedId);
            if (selectedArrumacao) {
                showArrumacaoContent(selectedArrumacao);
                updateCarouselWithArrumacao(selectedArrumacao);
                document.getElementById('selected-arrumacao').value = selectedId;
            }
        } else {
            contentContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Selecione uma arrumação para ver os detalhes.</p>';
            document.getElementById('selected-arrumacao').value = '';
            // Reset to default carousel
            updateCarouselWithArrumacao({carouselImages: []});
        }
    });
}

// Show arrumacao content
function showArrumacaoContent(arrumacao) {
    const contentContainer = document.getElementById('arrumacao-content');
    
    let imagesHtml = '';
    if (arrumacao.galleryImages && arrumacao.galleryImages.length > 0) {
        imagesHtml = '<div class="arrumacao-gallery">';
        arrumacao.galleryImages.forEach(img => {
            imagesHtml += `<img src="${img}" alt="${arrumacao.title}">`;
        });
        imagesHtml += '</div>';
    }
    
    contentContainer.innerHTML = `
        <div class="arrumacao-detail">
            <h3>${arrumacao.title} (ID: ${arrumacao.id})</h3>
            <div class="arrumacao-price">R$ ${arrumacao.price.toFixed(2)}</div>
            <p>${arrumacao.description}</p>
            ${imagesHtml}
        </div>
    `;
    
    // Update carousel with arrumacao's carousel images
    updateCarouselWithArrumacao(arrumacao);
}

// Update carousel with arrumacao's carousel images
function updateCarouselWithArrumacao(arrumacao) {
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselIndicators = document.querySelector('.carousel-indicators');
    
    if (arrumacao.carouselImages && arrumacao.carouselImages.length > 0) {
        // Update carousel images
        let imagesHtml = '';
        arrumacao.carouselImages.forEach(img => {
            imagesHtml += `<img src="${img}" alt="${arrumacao.title}">`;
        });
        carouselSlide.innerHTML = imagesHtml;
        
        // Update indicators
        let indicatorsHtml = '';
        arrumacao.carouselImages.forEach((_, index) => {
            indicatorsHtml += `<span class="indicator" onclick="currentSlide(${index})"></span>`;
        });
        carouselIndicators.innerHTML = indicatorsHtml;
        
        // Update total slides
        totalSlides = arrumacao.carouselImages.length;
        
        // Reset carousel state
        currentSlideIndex = 0;
        updateCarousel();
        
        // Update slide width based on number of images
        carouselSlide.style.width = `${totalSlides * 100}%`;
        document.querySelectorAll('.carousel-slide img').forEach(img => {
            img.style.width = `${100 / totalSlides}%`;
        });
    } else {
        // Default images if no carousel images
        carouselSlide.innerHTML = `
            <img src="https://images.unsplash.com/photo-1530103862676-de3c9a59af38?w=800" alt="Arrumações 1">
            <img src="https://images.unsplash.com/photo-1460312675542-4e8405a7f0c4?w=800" alt="Arrumações 2">
            <img src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800" alt="Arrumações 3">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" alt="Arrumações 4">
        `;
        carouselIndicators.innerHTML = `
            <span class="indicator" onclick="currentSlide(0)"></span>
            <span class="indicator" onclick="currentSlide(1)"></span>
            <span class="indicator" onclick="currentSlide(2)"></span>
            <span class="indicator" onclick="currentSlide(3)"></span>
        `;
        totalSlides = 4;
        carouselSlide.style.width = '400%';
        document.querySelectorAll('.carousel-slide img').forEach(img => {
            img.style.width = '25%';
        });
        currentSlideIndex = 0;
        updateCarousel();
    }
}

// Carousel functionality
let currentSlideIndex = 0;
let totalSlides = 4; // Default

function updateCarousel() {
    const slides = document.querySelector('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (slides) {
        slides.style.transform = `translateX(-${currentSlideIndex * (100 / totalSlides)}%)`;
    }
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlideIndex);
    });
}

function moveSlide(direction) {
    currentSlideIndex = (currentSlideIndex + direction + totalSlides) % totalSlides;
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

// Handle rental form submission
document.getElementById('rental-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const selectedArrumacaoId = document.getElementById('selected-arrumacao').value;
    
    if (!selectedArrumacaoId) {
        alert('Por favor, selecione uma arrumação primeiro.');
        return;
    }
    
    // Get selected arrumacao
    const arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
    const selectedArrumacao = arrumacoes.find(arr => arr.id === selectedArrumacaoId);
    
    if (!selectedArrumacao) {
        alert('Arrumação selecionada não encontrada.');
        return;
    }
    
    // Build rental items
    const items = [{
        name: selectedArrumacao.title,
        service: 'Arrumações',
        quantity: 1,
        price: selectedArrumacao.price,
        total: selectedArrumacao.price,
        productId: selectedArrumacao.id
    }];
    
    // Store rental as pending
    const rentalId = rentalManager.addRentalWithQuantity('arrumacoes', date, {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        message: message,
        items: items,
        totalPrice: selectedArrumacao.price
    });
    
    // Build WhatsApp message
    const whatsappMessage = `Olá! Gostaria de solicitar uma Arrumação\n\nInformações do pedido:\n- Nome: ${name}\n- Data do evento: ${date}\n- Arrumação: ${selectedArrumacao.title}\n- Preço: R$ ${selectedArrumacao.price.toFixed(2)}\n- Telefone: ${phone}\n- Email: ${email}\n- Mensagem: ${message || 'Nenhuma mensagem adicional'}\n\nCódigo do pedido: ${rentalId}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Show success message
    alert('✅ Solicitação enviada! Aguarde a confirmação do administrador. Você será redirecionado para o WhatsApp.');
    
    // Redirect to WhatsApp
    window.location.href = `https://wa.me/5521975600493?text=${encodedMessage}`;
    
    this.reset();
});

// Load comments on page load
loadComments();