class ProductsViewer {
    constructor() {
        this.currentPage = 1;
        this.limit = 20;
        this.totalPages = 1;
        this.currentFilters = {
            search: '',
            category: '',
            department: ''
        };
        
        this.init();
    }

    async init() {
        await this.loadFilterOptions();
        await this.loadProducts();
        this.bindEvents();
    }

    async loadFilterOptions() {
        try {
            // Load categories
            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            
            const categorySelect = document.getElementById('categoryFilter');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            // Load departments
            const departmentsResponse = await fetch('/api/departments');
            const departments = await departmentsResponse.json();
            
            const departmentSelect = document.getElementById('departmentFilter');
            departments.forEach(department => {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    async loadProducts() {
        const loading = document.getElementById('loading');
        const container = document.getElementById('productsContainer');
        
        loading.style.display = 'block';
        container.innerHTML = '';

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                ...this.currentFilters
            });

            const response = await fetch(`/api/products?${params}`);
            const data = await response.json();

            this.displayProducts(data.products);
            this.updatePagination(data.pagination);
            this.updateStats(data.pagination);
        } catch (error) {
            console.error('Error loading products:', error);
            container.innerHTML = '<p>Error loading products. Please try again.</p>';
        } finally {
            loading.style.display = 'none';
        }
    }

    displayProducts(products) {
        const container = document.getElementById('productsContainer');
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: white; font-size: 1.1rem;">No products found matching your criteria.</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <div class="product-name">${this.escapeHtml(product.name)}</div>
                    <div class="product-brand">${this.escapeHtml(product.brand)}</div>
                </div>
                
                <div class="product-details">
                    <span class="product-category">${this.escapeHtml(product.category)}</span>
                    <span class="product-department">${this.escapeHtml(product.department)}</span>
                </div>
                
                <div class="product-pricing">
                    <div>
                        <div class="cost">Cost: $${product.cost.toFixed(2)}</div>
                        <div class="retail-price">Retail: $${product.retail_price.toFixed(2)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: #6c757d;">ID: ${product.id}</div>
                        <div style="font-size: 0.9rem; color: #6c757d;">DC: ${product.distribution_center_id}</div>
                    </div>
                </div>
                
                <div class="product-sku">SKU: ${this.escapeHtml(product.sku)}</div>
            </div>
        `).join('');
    }

    updatePagination(pagination) {
        this.currentPage = pagination.page;
        this.totalPages = pagination.totalPages;
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.totalPages;
        pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    }

    updateStats(pagination) {
        const totalProducts = document.getElementById('totalProducts');
        const currentPage = document.getElementById('currentPage');
        
        totalProducts.textContent = `Total Products: ${pagination.total.toLocaleString()}`;
        
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.page * pagination.limit, pagination.total);
        currentPage.textContent = `Showing ${start}-${end} of ${pagination.total}`;
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            this.currentFilters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadProducts();
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('departmentFilter').addEventListener('change', (e) => {
            this.currentFilters.department = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            searchInput.value = '';
            document.getElementById('categoryFilter').value = '';
            document.getElementById('departmentFilter').value = '';
            this.currentFilters = { search: '', category: '', department: '' };
            this.currentPage = 1;
            this.loadProducts();
        });

        // Pagination
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadProducts();
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadProducts();
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProductsViewer();
});