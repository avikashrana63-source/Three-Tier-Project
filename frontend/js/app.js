(function () {
  const apiBase = '/api';
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const state = {
    menu: [],
    editingItemId: null
  };

  function el(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function request(path, options) {
    const response = await fetch(`${apiBase}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    return data;
  }

  function groupByCategory(items) {
    return items.reduce((groups, item) => {
      const category = item.category || 'Menu';
      groups[category] = groups[category] || [];
      groups[category].push(item);
      return groups;
    }, {});
  }

  function renderMenuItems() {
    const menuList = el('#dynamic-menu-list');
    const orderSelect = el('#order-item');

    if (!menuList || !orderSelect) {
      return;
    }

    const availableItems = state.menu.filter((item) => item.available);
    const groups = groupByCategory(availableItems);

    menuList.innerHTML = Object.keys(groups).length
      ? Object.entries(groups).map(([category, items]) => `
          <div class="col-lg-6 col-12 mb-4">
            <div class="menu-block-wrap h-100">
              <div class="text-center mb-4 pb-lg-2">
                <em class="text-white">Cafe Menu</em>
                <h4 class="text-white">${escapeHtml(category)}</h4>
              </div>
              ${items.map((item, index) => `
                <div class="menu-block ${index ? 'my-4' : ''}">
                  <div class="d-flex align-items-center">
                    <h6>${escapeHtml(item.name)}</h6>
                    <span class="underline"></span>
                    <strong class="ms-auto">${currency.format(item.price)}</strong>
                  </div>
                  <div class="border-top mt-2 pt-2">
                    <small>${escapeHtml(item.description || 'Fresh from the cafe kitchen')}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')
      : '<div class="col-12"><p class="text-white text-center">No menu items available yet.</p></div>';

    orderSelect.innerHTML = '<option value="">Choose menu item</option>' + availableItems.map((item) => (
      `<option value="${item.id}">${escapeHtml(item.name)} - ${currency.format(item.price)}</option>`
    )).join('');
  }

  function renderAdminRows() {
    const rows = el('#menu-admin-rows');

    if (!rows) {
      return;
    }

    rows.innerHTML = state.menu.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${currency.format(item.price)}</td>
        <td>${item.available ? 'Yes' : 'No'}</td>
        <td>
          <button class="btn custom-btn menu-edit-btn" type="button" data-item-id="${item.id}">
            Edit
          </button>
        </td>
      </tr>
    `).join('');
  }

  function setStatus(selector, message, isError) {
    const status = el(selector);

    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle('text-danger', Boolean(isError));
    status.classList.toggle('text-success', !isError && Boolean(message));
  }

  function fillMenuForm(item) {
    el('#menu-id').value = item ? item.id : '';
    el('#menu-name').value = item ? item.name : '';
    el('#menu-category').value = item ? item.category : '';
    el('#menu-price').value = item ? item.price : '';
    el('#menu-description').value = item ? item.description || '' : '';
    el('#menu-available').checked = item ? item.available : true;
    el('#menu-submit').textContent = item ? 'Update Menu' : 'Add Menu';
    state.editingItemId = item ? item.id : null;
  }

  async function loadMenu() {
    state.menu = await request('/menu');
    renderMenuItems();
    renderAdminRows();
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();

    const id = el('#menu-id').value;
    const payload = {
      name: el('#menu-name').value,
      category: el('#menu-category').value,
      price: el('#menu-price').value,
      description: el('#menu-description').value,
      available: el('#menu-available').checked
    };

    try {
      await request(id ? `/menu/${id}` : '/menu', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      event.target.reset();
      fillMenuForm(null);
      setStatus('#menu-form-status', id ? 'Menu item updated.' : 'Menu item added.', false);
      await loadMenu();
    } catch (error) {
      setStatus('#menu-form-status', error.message, true);
    }
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();

    const payload = {
      customerName: el('#customer-name').value,
      mobileContact: el('#customer-mobile').value,
      itemId: Number(el('#order-item').value),
      quantity: Number(el('#order-quantity').value || 1),
      notes: el('#order-notes').value
    };

    try {
      const order = await request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      event.target.reset();
      el('#order-quantity').value = 1;
      setStatus('#order-form-status', `Order #${order.id} saved. Total: ${currency.format(order.totalPrice)}.`, false);
    } catch (error) {
      setStatus('#order-form-status', error.message, true);
    }
  }

  function bindEvents() {
    const menuForm = el('#menu-admin-form');
    const orderForm = el('#customer-order-form');
    const resetButton = el('#menu-reset');
    const rows = el('#menu-admin-rows');

    if (menuForm) {
      menuForm.addEventListener('submit', handleMenuSubmit);
    }

    if (orderForm) {
      orderForm.addEventListener('submit', handleOrderSubmit);
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        fillMenuForm(null);
        setStatus('#menu-form-status', '', false);
      });
    }

    if (rows) {
      rows.addEventListener('click', (event) => {
        const button = event.target.closest('.menu-edit-btn');

        if (!button) {
          return;
        }

        const item = state.menu.find((menuItem) => menuItem.id === Number(button.dataset.itemId));
        fillMenuForm(item);
      });
    }
  }

  async function start() {
    if (!el('#dynamic-menu-list')) {
      return;
    }

    bindEvents();

    try {
      await loadMenu();
    } catch (error) {
      setStatus('#menu-form-status', 'Menu API is not available. Start the containers and refresh.', true);
      setStatus('#order-form-status', 'Menu API is not available. Start the containers and refresh.', true);
    }
  }

  document.addEventListener('DOMContentLoaded', start);
})();
