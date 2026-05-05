// Sistema de gerenciamento de datas de aluguel
class RentalDateManager {
    constructor() {
        this.services = {
            'pula_pula': 'Pula Pula',
            'area_kids': 'Área Kids',
            'arrumacoes': 'Arrumações',
            'cadeiras': 'Cadeiras'
        };
        // Capacidades padrão
        this.capacities = {
            'cadeiras': { chairs: 44, tables: 11 }
        };
        
        // Carregar capacidades do localStorage
        const savedCapacities = localStorage.getItem('capacities');
        if (savedCapacities) {
            this.capacities = { ...this.capacities, ...JSON.parse(savedCapacities) };
        }
    }

    // Obter chave do serviço baseado na URL
    getCurrentService() {
        const path = window.location.pathname;
        if (path.includes('pula_pula')) return 'pula_pula';
        if (path.includes('area_kids')) return 'area_kids';
        if (path.includes('arrumacoes')) return 'arrumacoes';
        if (path.includes('cadeiras')) return 'cadeiras';
        return null;
    }

    // Obter chave de armazenamento para datas bloqueadas
    getBlockedDatesKey(service) {
        return `blocked_dates_${service}`;
    }

    // Adicionar data bloqueada
    blockDate(service, date) {
        const key = this.getBlockedDatesKey(service);
        let blockedDates = JSON.parse(localStorage.getItem(key)) || [];
        
        if (!blockedDates.includes(date)) {
            blockedDates.push(date);
            localStorage.setItem(key, JSON.stringify(blockedDates));
        }
    }

    // Remover data bloqueada
    unblockDate(service, date) {
        const key = this.getBlockedDatesKey(service);
        let blockedDates = JSON.parse(localStorage.getItem(key)) || [];
        
        blockedDates = blockedDates.filter(d => d !== date);
        localStorage.setItem(key, JSON.stringify(blockedDates));
    }

    // Verificar se data está disponível
    isDateAvailable(service, date) {
        const key = this.getBlockedDatesKey(service);
        const blockedDates = JSON.parse(localStorage.getItem(key)) || [];
        return !blockedDates.includes(date);
    }

    // Obter todas as datas bloqueadas de um serviço
    getBlockedDates(service) {
        const key = this.getBlockedDatesKey(service);
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    // Obter todas as datas bloqueadas de todos os serviços
    getAllBlockedDates() {
        const result = {};
        Object.keys(this.services).forEach(service => {
            result[service] = this.getBlockedDates(service);
        });
        return result;
    }

    // Adicionar aluguel e bloquear data
    addRental(service, date, rentalInfo) {
        // Bloquear a data
        this.blockDate(service, date);
        
        // Armazenar informações do aluguel
        const key = `rental_${service}`;
        let rentals = JSON.parse(localStorage.getItem(key)) || [];
        rentals.push({
            date: date,
            info: rentalInfo,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(rentals));
    }

    // Obter aluguéis de um serviço
    getRentals(service) {
        const key = `rental_${service}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    // Obter todos os aluguéis
    getAllRentals() {
        const result = {};
        Object.keys(this.services).forEach(service => {
            result[service] = this.getRentals(service);
        });
        return result;
    }

    // Remover aluguel
    removeRental(service, index) {
        const key = `rental_${service}`;
        let rentals = JSON.parse(localStorage.getItem(key)) || [];
        
        if (rentals[index]) {
            const date = rentals[index].date;
            rentals.splice(index, 1);
            localStorage.setItem(key, JSON.stringify(rentals));
            
            // Se não há mais aluguéis para essa data, desbloquear
            const hasOtherRentals = rentals.some(r => r.date === date);
            if (!hasOtherRentals) {
                this.unblockDate(service, date);
            }
        }
    }

    // Verificar disponibilidade de quantidades para uma data
    checkAvailability(service, date, requestedChairs, requestedTables) {
        if (!this.capacities[service]) {
            return { available: true }; // Sem limite de quantidade
        }

        const capacity = this.capacities[service];
        const rentals = this.getRentals(service);
        const dateRentals = rentals.filter(r => r.date === date);

        let usedChairs = 0;
        let usedTables = 0;

        dateRentals.forEach(rental => {
            usedChairs += rental.info.chairs || 0;
            usedTables += rental.info.tables || 0;
        });

        const availableChairs = capacity.chairs - usedChairs;
        const availableTables = capacity.tables - usedTables;

        return {
            available: requestedChairs <= availableChairs && requestedTables <= availableTables,
            availableChairs: availableChairs,
            availableTables: availableTables
        };
    }

    // Adicionar aluguel com quantidades
    addRentalWithQuantity(service, date, rentalInfo) {
        // Armazenar informações do aluguel
        const key = `rental_${service}`;
        let rentals = JSON.parse(localStorage.getItem(key)) || [];
        rentals.push({
            date: date,
            info: rentalInfo,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(rentals));
    }
}

// Criar instância global
const rentalManager = new RentalDateManager();
