const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

app.use(cors());
app.use(express.json());

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      category VARCHAR(80) NOT NULL DEFAULT 'Coffee',
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      available BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(120) NOT NULL,
      mobile_contact VARCHAR(30) NOT NULL,
      item_id INTEGER NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    INSERT INTO menu_items (name, category, description, price)
    VALUES
      ('Pancakes', 'Breakfast', 'Fresh brewed coffee and steamed milk', 12.50),
      ('Toasted Waffle', 'Breakfast', 'Brewed coffee and steamed milk', 12.00),
      ('Fried Chips', 'Breakfast', 'Rich milk and foam', 15.00),
      ('Latte', 'Coffee', 'Fresh brewed coffee and steamed milk', 7.50),
      ('White Coffee', 'Coffee', 'Brewed coffee and steamed milk', 5.90),
      ('Chocolate Milk', 'Coffee', 'Rich milk and foam', 5.50)
    ON CONFLICT (name) DO NOTHING;
  `);
}

async function initDbWithRetry(retries = 12, delayMs = 2500) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await initDb();
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      console.warn(`Database is not ready yet, retrying (${attempt}/${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function normalizeMenuPayload(body) {
  return {
    name: String(body.name || '').trim(),
    category: String(body.category || 'Coffee').trim(),
    description: String(body.description || '').trim(),
    price: Number(body.price),
    available: body.available !== false
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ error: 'Database is not ready' });
  }
});

app.get('/api/menu', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, name, category, description, price::float, available
      FROM menu_items
      ORDER BY category, name
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/menu', async (req, res, next) => {
  try {
    const item = normalizeMenuPayload(req.body);

    if (!item.name || !item.category || Number.isNaN(item.price) || item.price < 0) {
      return res.status(400).json({ error: 'Name, category, and a valid price are required.' });
    }

    const result = await query(
      `INSERT INTO menu_items (name, category, description, price, available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, category, description, price::float, available`,
      [item.name, item.category, item.description, item.price, item.available]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A menu item with this name already exists.' });
    }
    next(error);
  }
});

app.put('/api/menu/:id', async (req, res, next) => {
  try {
    const item = normalizeMenuPayload(req.body);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || !item.name || !item.category || Number.isNaN(item.price) || item.price < 0) {
      return res.status(400).json({ error: 'Valid item id, name, category, and price are required.' });
    }

    const result = await query(
      `UPDATE menu_items
       SET name = $1, category = $2, description = $3, price = $4, available = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, category, description, price::float, available`,
      [item.name, item.category, item.description, item.price, item.available, id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A menu item with this name already exists.' });
    }
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const customerName = String(req.body.customerName || '').trim();
    const mobileContact = String(req.body.mobileContact || '').trim();
    const itemId = Number(req.body.itemId);
    const quantity = Number(req.body.quantity || 1);
    const notes = String(req.body.notes || '').trim();

    if (!customerName || !mobileContact || !Number.isInteger(itemId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Customer name, mobile contact, menu item, and quantity are required.' });
    }

    const menuItem = await query(
      'SELECT id, price::float FROM menu_items WHERE id = $1 AND available = TRUE',
      [itemId]
    );

    if (!menuItem.rowCount) {
      return res.status(404).json({ error: 'Menu item not found or unavailable.' });
    }

    const unitPrice = Number(menuItem.rows[0].price);
    const totalPrice = Number((unitPrice * quantity).toFixed(2));

    const result = await query(
      `INSERT INTO orders (customer_name, mobile_contact, item_id, quantity, unit_price, total_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, customer_name AS "customerName", mobile_contact AS "mobileContact",
                 item_id AS "itemId", quantity, unit_price::float AS "unitPrice",
                 total_price::float AS "totalPrice", notes, created_at AS "createdAt"`,
      [customerName, mobileContact, itemId, quantity, unitPrice, totalPrice, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT o.id, o.customer_name AS "customerName", o.mobile_contact AS "mobileContact",
             m.name AS "itemName", o.quantity, o.total_price::float AS "totalPrice",
             o.notes, o.created_at AS "createdAt"
      FROM orders o
      JOIN menu_items m ON m.id = o.item_id
      ORDER BY o.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

initDbWithRetry()
  .then(() => {
    app.listen(port, () => {
      console.log(`Barista Cafe API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
