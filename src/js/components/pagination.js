class Paginator {
    currentPage = 1;
    itemsPerPage = 8;
    totalPages = 1;
    delta = 1;
    ellipsisTemplate = `<li class='pg-item pg-ellipsis'>...</li>`;
    items = null;
    api = null;
    apiHandler = null;
  
    constructor(selector) {
      this.rootEl = document.querySelector(selector);
      this.rootEl.innerHTML = '<button class=\'prev-page\'>Prev</button><ul class=\'pages\'></ul><button class=\'next-page\'>Next</button>';
      this.pagesEl = this.rootEl.querySelector('.pages');
      this.btnPrev = this.rootEl.querySelector('.prev-page');
      this.btnNext = this.rootEl.querySelector('.next-page');
      this.addEventListeners();
    }
  
    paginate(options) {
      this.itemsPerPage = options.perPage;
      this.items = options.items;
      this.api = options.api;
      if (this.api) {
        // Paginator will handle api calls, for now set to 1
        this.totalPages = 1;
      } else {
        // Paginate simple array of items
        this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
      }
      this.onPageChangedCallback = options.onPageChanged;
      this.setPage(1); // set to 1st page by default
    }
  
    async onPageChanged() {
      let paginated;
      if (this.api) {
  
        if (this.api.externalHandler) {
          // external function to handle api
          paginated = await this.api.externalHandler.onPageChanged(this); // pass paginator instance
        } else {
          const offset = (this.currentPage - 1) * this.itemsPerPage;
          const apiParams = { ...this.api.params, ...{ limit: this.itemsPerPage, offset: offset } };
          const result = await this.api.method(apiParams);
          if (offset === 0) {
            // total changes everytime offset changes, so remember it only on initial call
            this.totalPages = Math.ceil(result.total / this.itemsPerPage);
          }
          paginated = result.articles;
        }
      } else {
        paginated = this.items.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
      }
      this.render();
      this.onPageChangedCallback(paginated);
    }
  
    addEventListeners() {
      this.btnPrev.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.setPage(this.currentPage - 1);
      });
      this.btnNext.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.setPage(this.currentPage + 1);
      });
    }
  
    async setPage(page) {
      if (page > this.totalPages) {
        page = this.totalPages;
      } else if (page < 1) {
        page = 1;
      }
      this.currentPage = page;
      await this.onPageChanged();
    }
  
    render() {
      const range = this.delta + 4;
      let truncated = 0;
      const truncatedLeft = this.currentPage - this.delta;
      const truncatedRight = this.currentPage + this.delta;
      let html = '';
      let htmlWithEllipsis = '';
      for (let i = 1; i <= this.totalPages; i++) {
        const isActive = i === this.currentPage;
        if (this.totalPages >= 2 * range - 1) {
          if (truncatedLeft > 3 && truncatedRight < this.totalPages - 3 + 1) {
            if (i >= truncatedLeft && i <= truncatedRight) {
              htmlWithEllipsis += this.renderPage(i, isActive);
            }
          } else {
            if (
              (this.currentPage < range && i <= range) ||
              (this.currentPage > this.totalPages - range &&
                i >= this.totalPages - range + 1) ||
              i === this.totalPages ||
              i === 1
            ) {
              html += this.renderPage(i, isActive);
            } else {
              truncated++;
              if (truncated === 1) {
                html += this.ellipsisTemplate;
              }
            }
          }
        } else {
          html += this.renderPage(i, isActive);
        }
      }
      if (htmlWithEllipsis) {
        this.pagesEl.innerHTML =
          this.renderPage(1) +
          this.ellipsisTemplate +
          htmlWithEllipsis +
          this.ellipsisTemplate +
          this.renderPage(this.totalPages);
        this.rootEl.style.display = 'block';
      } else if (html) {
        this.pagesEl.innerHTML = html;
        this.rootEl.style.display = 'block';
      } else {
        this.rootEl.style.display = 'none';
      }
      this.btnPrev.disabled = this.currentPage === 1;
      this.btnNext.disabled = this.currentPage === this.totalPages;
  
      this.pagesEl.querySelectorAll('.pg-link').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(el.dataset.page, 10);
          if (page !== this.currentPage) {
            this.setPage(page);
          }
        });
      });
  
    }
  
    renderPage(page, isActive) {
      return `<li class='pg-item${
        isActive ? ' active' : ''
      }'><a class='pg-link' href='#' data-page='${page}'>${page}</a></li>`;
    }
  }
  
  export default new Paginator('.pagination');