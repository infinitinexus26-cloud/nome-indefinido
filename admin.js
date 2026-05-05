// Admin password (in production, use proper authentication)
const ADMIN_PASSWORD = '301086';

// DOM Elements
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const logoutBtn = document.getElementById('logout-btn');
const siteStatusBtn = document.getElementById('site-status-btn');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Service tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const commentsList = document.getElementById('comments-list');

// Services data
const services = {
    'comments': { name: 'Pula Pula', key: 'comments' },
    'comments-area-kids': { name: 'Área Kids', key: 'comments-area-kids' },
    'comments-arrumacoes': { name: 'Arrumações', key: 'comments-arrumacoes' },
    'comments-cadeiras': { name: 'Cadeiras', key: 'comments-cadeiras' }
};

// Login handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (passwordInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin-logged', 'true');
        showAdminPanel();
        passwordInput.value = '';
    } else {
        errorMessage.textContent = 'Senha incorreta!';
        passwordInput.value = '';
    }
});

// Logout handler
logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('admin-logged');
    loginContainer.style.display = 'flex';
    adminContainer.style.display = 'none';
    errorMessage.textContent = '';
    passwordInput.value = '';
});

// Show admin panel
function showAdminPanel() {
    loginContainer.style.display = 'none';
    adminContainer.style.display = 'flex';
    loadStats();
    updateSiteStatus();
}

// Check if already logged in
window.addEventListener('load', function() {
    if (sessionStorage.getItem('admin-logged') === 'true') {
        showAdminPanel();
    }
    // Initialize site status if not set
    if (localStorage.getItem('siteOnline') === null) {
        localStorage.setItem('siteOnline', 'true');
    }
    updateSiteStatus();
});

// Navigation handler
navBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        
        // Remove active class from all buttons and pages
        navBtns.forEach(b => b.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding page
        this.classList.add('active');
        document.getElementById(page + '-page').classList.add('active');
        
        // Load content based on page
        if (page === 'comments') {
            loadComments('comments');
        } else if (page === 'rentals') {
            loadRentalsPage();
        } else if (page === 'arrumacoes') {
            loadArrumacoes();
        } else if (page === 'estoque') {
            loadEstoqueInfo();
        }
    });
});

// Rental management
const rentalTabBtns = document.querySelectorAll('#rentals-page .service-tabs .tab-btn');
const rentedItemsList = document.getElementById('rented-items-list');
const markRentedForm = document.getElementById('mark-rented-form');
let currentRentalService = 'cadeiras';

rentalTabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        currentRentalService = this.getAttribute('data-service');
        rentalTabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        loadRentalsPage();
    });
});

function loadRentalsPage() {
    loadMarkedRentals(currentRentalService);
    updateRentalFormFields(currentRentalService);
}

function loadMarkedRentals(service) {
    const rentals = rentalManager.getRentals(service);
    if (!rentedItemsList) return;

    if (rentals.length === 0) {
        rentedItemsList.innerHTML = '<div class="empty-message">Nenhum item marcado como alugado para este serviço.</div>';
        return;
    }

    rentedItemsList.innerHTML = '';
    rentals.forEach((rental, index) => {
        const div = document.createElement('div');
        div.className = 'date-item';
        const rentalDate = new Date(rental.date + 'T00:00:00');
        const formattedDate = rentalDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let details = `<strong>${formattedDate}</strong><br>`;
        details += `<small>Cliente: ${rental.info.customerName || rental.info.name || '---'}</small><br>`;
        details += `<small>Item: ${rental.info.itemDescription || rental.info.items?.map(i => i.name).join(', ') || '---'}</small><br>`;
        if (rental.info.itemCode) {
            details += `<small>Código: ${rental.info.itemCode}</small><br>`;
        }
        if (rental.info.chairs || rental.info.tables) {
            details += `<small>Cadeiras: ${rental.info.chairs || 0} / Mesas: ${rental.info.tables || 0}</small><br>`;
        }
        details += `<small>Preço total: R$ ${Number(rental.info.totalPrice || rental.info.price || rental.info.total || 0).toFixed(2)}</small>`;

        div.innerHTML = `
            <div class="date-info">${details}</div>
            <button class="unblock-btn" onclick="deleteRental('${service}', ${index})">Remover</button>
        `;
        rentedItemsList.appendChild(div);
    });
}

function updateRentalFormFields(service) {
    const chairTableFields = document.getElementById('rent-chair-table-fields');
    const itemDescription = document.getElementById('rent-item-description');
    const itemCode = document.getElementById('rent-item-code');

    if (!chairTableFields || !itemDescription || !itemCode) return;

    if (service === 'cadeiras') {
        chairTableFields.style.display = 'grid';
        itemDescription.placeholder = 'Ex: Aluguel de cadeiras ou mesas';
        itemCode.placeholder = 'Código do pedido (opcional)';
    } else if (service === 'arrumacoes') {
        chairTableFields.style.display = 'none';
        itemDescription.placeholder = 'Ex: Arrumação especial, ID de arrumação';
        itemCode.placeholder = 'Código da arrumação (opcional)';
    } else {
        chairTableFields.style.display = 'none';
        itemDescription.placeholder = 'Ex: Pula Pula, Área Kids';
        itemCode.placeholder = 'Código do item (opcional)';
    }
}

if (markRentedForm) {
    markRentedForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const date = document.getElementById('rent-date').value;
        const itemDescription = document.getElementById('rent-item-description').value;
        const itemCode = document.getElementById('rent-item-code').value;
        const customerName = document.getElementById('rent-customer-name').value;
        const customerPhone = document.getElementById('rent-customer-phone').value;
        const customerEmail = document.getElementById('rent-customer-email').value;
        const price = parseFloat(document.getElementById('rent-item-price').value) || 0;
        const note = document.getElementById('rent-note').value;
        const chairs = parseInt(document.getElementById('rent-chairs').value) || 0;
        const tables = parseInt(document.getElementById('rent-tables').value) || 0;
        const chairPrice = parseFloat(document.getElementById('rent-chair-price').value) || 0;
        const tablePrice = parseFloat(document.getElementById('rent-table-price').value) || 0;

        if (!date || !itemDescription || !customerName || !customerPhone || !customerEmail) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        if (currentRentalService === 'cadeiras') {
            const availability = rentalManager.checkAvailability('cadeiras', date, chairs, tables);
            if (!availability.available) {
                alert(`❌ Quantidade insuficiente disponível para esta data. Disponível:\n- Cadeiras: ${availability.availableChairs}\n- Mesas: ${availability.availableTables}`);
                return;
            }
        }

        const rentalInfo = {
            itemDescription: itemDescription,
            itemCode: itemCode,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            note: note,
            totalPrice: price,
            chairs: chairs,
            tables: tables,
            chairPrice: chairPrice,
            tablePrice: tablePrice,
            createdByAdmin: true
        };

        if (currentRentalService === 'cadeiras') {
            rentalManager.addRentalWithQuantity('cadeiras', date, rentalInfo);
        } else {
            rentalManager.addRental(currentRentalService, date, rentalInfo);
        }

        this.reset();
        loadMarkedRentals(currentRentalService);
        alert('✅ Item marcado como alugado com sucesso!');
    });
}

function deleteRental(service, index) {
    if (confirm('Tem certeza que deseja remover este registro de aluguel?')) {
        rentalManager.removeRental(service, index);
        loadMarkedRentals(service);
    }
}

// Load stats
function loadStats() {
    const stats = {
        'comments': document.getElementById('stat-pula-pula'),
        'comments-area-kids': document.getElementById('stat-area-kids'),
        'comments-arrumacoes': document.getElementById('stat-arrumacoes'),
        'comments-cadeiras': document.getElementById('stat-cadeiras')
    };

    Object.keys(stats).forEach(key => {
        const comments = JSON.parse(localStorage.getItem(key)) || [];
        stats[key].textContent = comments.length;
    });
}

// Load comments
function loadComments(serviceKey) {
    const comments = JSON.parse(localStorage.getItem(serviceKey)) || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="empty-message">Nenhum comentário disponível neste serviço.</div>';
        return;
    }

    commentsList.innerHTML = '';
    
    comments.forEach((comment, index) => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        let html = `
            <div class="comment-rating">${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)} (${comment.rating}/5 estrelas)</div>
        `;
        
        if (comment.photo) {
            html += `<img src="${comment.photo}" alt="Foto do comentário" class="comment-photo">`;
        }
        
        html += `
            <p class="comment-text">${comment.text}</p>
            <div class="comment-actions">
                <button class="delete-btn" onclick="deleteComment('${serviceKey}', ${index})">🗑️ Deletar</button>
            </div>
        `;
        
        div.innerHTML = html;
        commentsList.appendChild(div);
    });
}

// Update site status button
function updateSiteStatus() {
    const isOnline = localStorage.getItem('siteOnline') === 'true';
    siteStatusBtn.textContent = isOnline ? 'Online' : 'Offline';
    siteStatusBtn.className = 'status-btn ' + (isOnline ? 'online' : 'offline');
}

// Site status button handler
siteStatusBtn.addEventListener('click', function() {
    const password = prompt('Digite a senha para alterar o status do site:');
    if (password === ADMIN_PASSWORD) {
        const isOnline = localStorage.getItem('siteOnline') === 'true';
        localStorage.setItem('siteOnline', !isOnline);
        updateSiteStatus();
        alert('Status do site alterado com sucesso!');
    } else {
        alert('Senha incorreta!');
    }
});

// Delete comment
function deleteComment(serviceKey, index) {
    if (confirm('Tem certeza que deseja deletar este comentário?')) {
        let comments = JSON.parse(localStorage.getItem(serviceKey)) || [];
        comments.splice(index, 1);
        localStorage.setItem(serviceKey, JSON.stringify(comments));
        
        loadComments(serviceKey);
        loadStats();
    }
}

// Dates management
const dateTabBtns = document.querySelectorAll('.service-tabs .tab-btn[data-service]');
const datesList = document.getElementById('dates-list');
const blockDateForm = document.getElementById('block-date-form');
let currentDateService = 'pula_pula';

// Setup date tabs (only for dates page)
dateTabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const service = this.getAttribute('data-service');
        currentDateService = service;
        
        // Remove active class from all tabs
        dateTabBtns.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Load dates for selected service
        loadBlockedDates(service);
    });
});

// Load blocked dates
function loadBlockedDates(service) {
    const blockedDates = rentalManager.getBlockedDates(service);
    
    if (datesList) {
        if (blockedDates.length === 0) {
            datesList.innerHTML = '<div class="empty-message">Nenhuma data bloqueada para este serviço.</div>';
            return;
        }

        datesList.innerHTML = '';
        
        blockedDates.forEach((date, index) => {
            const div = document.createElement('div');
            div.className = 'date-item';
            
            const dateObj = new Date(date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            div.innerHTML = `
                <div class="date-info">
                    <strong>${formattedDate}</strong><br>
                    <small>${date}</small>
                </div>
                <button class="unblock-btn" onclick="unblockDate('${service}', '${date}')">✓ Liberar</button>
            `;
            
            datesList.appendChild(div);
        });
    }
}

// Unblock date
function unblockDate(service, date) {
    if (confirm(`Tem certeza que deseja liberar a data ${date}?`)) {
        rentalManager.unblockDate(service, date);
        loadBlockedDates(service);
    }
}

// Block new date
if (blockDateForm) {
    blockDateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newDate = document.getElementById('new-date').value;
        
        if (newDate) {
            rentalManager.blockDate(currentDateService, newDate);
            document.getElementById('new-date').value = '';
            loadBlockedDates(currentDateService);
            alert('✓ Data bloqueada com sucesso!');
        }
    });
}

// Initialize
loadStats();
loadBlockedDates('pula_pula');

// Arrumações management
const addArrumacaoForm = document.getElementById('add-arrumacao-form');

// Load arrumações
function loadArrumacoes() {
    const arrumacoesList = document.getElementById('arrumacoes-list');
    arrumacoesList.innerHTML = '';
    
    const arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
    
    if (arrumacoes.length === 0) {
        arrumacoesList.innerHTML = '<div class="empty-message">Nenhuma arrumação cadastrada.</div>';
        return;
    }
    
    arrumacoes.forEach((arrumacao, index) => {
        const div = document.createElement('div');
        div.className = 'arrumacao-item';
        
        let imagesHtml = '';
        if ((arrumacao.carouselImages && arrumacao.carouselImages.length > 0) || 
            (arrumacao.galleryImages && arrumacao.galleryImages.length > 0)) {
            imagesHtml = '<div class="arrumacao-images">';
            
            if (arrumacao.carouselImages && arrumacao.carouselImages.length > 0) {
                imagesHtml += '<div class="image-section"><h5>Carrossel:</h5>';
                arrumacao.carouselImages.forEach(img => {
                    imagesHtml += `<img src="${img}" alt="${arrumacao.title} - Carrossel">`;
                });
                imagesHtml += '</div>';
            }
            
            if (arrumacao.galleryImages && arrumacao.galleryImages.length > 0) {
                imagesHtml += '<div class="image-section"><h5>Galeria:</h5>';
                arrumacao.galleryImages.forEach(img => {
                    imagesHtml += `<img src="${img}" alt="${arrumacao.title} - Galeria">`;
                });
                imagesHtml += '</div>';
            }
            
            imagesHtml += '</div>';
        }
        
        div.innerHTML = `
            <h4>${arrumacao.title}</h4>
            <div class="price">R$ ${arrumacao.price.toFixed(2)}</div>
            <div class="description">${arrumacao.description}</div>
            ${imagesHtml}
            <div class="arrumacao-actions">
                <button class="edit-arrumacao-btn" onclick="editArrumacao(${index})">Editar</button>
                <button class="delete-arrumacao-btn" onclick="deleteArrumacao(${index})">Deletar</button>
            </div>
        `;
        
        arrumacoesList.appendChild(div);
    });
}

// Add arrumacao form handler
if (addArrumacaoForm) {
    addArrumacaoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('arrumacao-title').value;
        const price = parseFloat(document.getElementById('arrumacao-price').value);
        const description = document.getElementById('arrumacao-description').value;
        const carouselImagesInput = document.getElementById('arrumacao-carousel-images');
        const galleryImagesInput = document.getElementById('arrumacao-gallery-images');
        const carouselImageFiles = carouselImagesInput.files;
        const galleryImageFiles = galleryImagesInput.files;
        
        // Process images
        const processImages = (files) => {
            return new Promise((resolve) => {
                const imageUrls = [];
                
                if (files.length === 0) {
                    resolve(imageUrls);
                    return;
                }
                
                let processedCount = 0;
                
                Array.from(files).forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        imageUrls[index] = event.target.result;
                        processedCount++;
                        if (processedCount === files.length) {
                            resolve(imageUrls);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            });
        };
        
        // Process both carousel and gallery images
        Promise.all([
            processImages(carouselImageFiles),
            processImages(galleryImageFiles)
        ]).then(([carouselImages, galleryImages]) => {
            const arrumacao = {
                title: title,
                price: price,
                description: description,
                carouselImages: carouselImages,
                galleryImages: galleryImages,
                id: 'ARR' + Date.now(),
                createdAt: new Date().toISOString()
            };
            
            let arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
            arrumacoes.push(arrumacao);
            localStorage.setItem('arrumacoes', JSON.stringify(arrumacoes));
            
            loadArrumacoes();
            this.reset();
            alert('Arrumação adicionada com sucesso!');
        });
    });
}

// Edit arrumacao
function editArrumacao(index) {
    const arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
    const arrumacao = arrumacoes[index];
    
    document.getElementById('arrumacao-title').value = arrumacao.title;
    document.getElementById('arrumacao-price').value = arrumacao.price;
    document.getElementById('arrumacao-description').value = arrumacao.description;
    // Note: Images will be replaced when form is submitted
    
    // Remove from array
    arrumacoes.splice(index, 1);
    localStorage.setItem('arrumacoes', JSON.stringify(arrumacoes));
    loadArrumacoes();
    
    alert('Edite os campos e selecione novas imagens se necessário. Clique em "Adicionar Arrumação" para salvar.');
}

// Delete arrumacao
function deleteArrumacao(index) {
    if (confirm('Tem certeza que deseja deletar esta arrumação?')) {
        let arrumacoes = JSON.parse(localStorage.getItem('arrumacoes')) || [];
        arrumacoes.splice(index, 1);
        localStorage.setItem('arrumacoes', JSON.stringify(arrumacoes));
        loadArrumacoes();
    }
}

// Estoque management
const estoqueForm = document.getElementById('estoque-form');

// Load estoque info
function loadEstoqueInfo() {
    const cadeirasTotal = document.getElementById('cadeiras-total');
    const mesasTotal = document.getElementById('mesas-total');
    const cadeirasInput = document.getElementById('cadeiras-capacidade');
    const mesasInput = document.getElementById('mesas-capacidade');
    
    // Get current capacity from rental-manager
    const capacity = rentalManager.capacities['cadeiras'] || { chairs: 44, tables: 11 };
    
    cadeirasTotal.textContent = capacity.chairs;
    mesasTotal.textContent = capacity.tables;
    cadeirasInput.value = capacity.chairs;
    mesasInput.value = capacity.tables;
}

// Estoque form handler
if (estoqueForm) {
    estoqueForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('estoque-password').value;
        const cadeirasCapacidade = parseInt(document.getElementById('cadeiras-capacidade').value);
        const mesasCapacidade = parseInt(document.getElementById('mesas-capacidade').value);
        
        if (password !== ADMIN_PASSWORD) {
            alert('Senha incorreta!');
            return;
        }
        
        // Update capacity in rental-manager
        rentalManager.capacities['cadeiras'] = {
            chairs: cadeirasCapacidade,
            tables: mesasCapacidade
        };
        
        // Save to localStorage
        localStorage.setItem('capacities', JSON.stringify(rentalManager.capacities));
        
        loadEstoqueInfo();
        this.reset();
        alert('Capacidade atualizada com sucesso!');
    });
}
