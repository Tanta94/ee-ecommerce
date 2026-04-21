-- ============================================
-- E&E E-Commerce Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS ee_ecommerce;
USE ee_ecommerce;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  category_id INT,
  stock_quantity INT DEFAULT 0,
  sizes JSON,        -- ["XS","S","M","L","XL","XXL"]
  colors JSON,       -- ["Black","White","Navy"]
  images JSON,       -- array of image URLs
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  guest_email VARCHAR(255),
  status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSON NOT NULL,
  payment_method VARCHAR(50),
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order Items Table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  size VARCHAR(10),
  color VARCHAR(50),
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Support Messages Table
CREATE TABLE support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  order_id INT,
  status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  admin_reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Wishlist Table
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- Seed Data
-- ============================================

INSERT INTO categories (name, slug, description) VALUES
('Women', 'women', 'Women clothing and accessories'),
('Men', 'men', 'Men clothing and accessories'),
('Kids', 'kids', 'Kids clothing and accessories'),
('Accessories', 'accessories', 'Bags, belts, scarves and more'),
('Home', 'home', 'Home decor and textiles');

INSERT INTO products (name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured) VALUES
('Linen Blend Shirt', 'Relaxed-fit shirt in a linen blend. Has a collar, buttons down the front, and short sleeves.', 29.99, NULL, 2, 50, '["S","M","L","XL","XXL"]', '["Black","White","Beige"]', '["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"]', TRUE),
('Slim Fit Chinos', 'Slim-fit chinos in stretch cotton. Has a zip fly with a button, side pockets and welt back pockets.', 39.99, 29.99, 2, 80, '["28","30","32","34","36"]', '["Khaki","Navy","Olive","Black"]', '["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600"]', TRUE),
('Floral Wrap Dress', 'Short wrap dress in woven fabric. Has a V-neck, long balloon sleeves, and a tie at the front.', 49.99, NULL, 1, 35, '["XS","S","M","L","XL"]', '["Blue Floral","Pink Floral","Green Floral"]', '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"]', TRUE),
('Oversized Blazer', 'Oversized single-breasted blazer. Has a notch lapel, padded shoulders, and button detail.', 89.99, 69.99, 1, 25, '["XS","S","M","L","XL"]', '["Camel","Black","Grey","White"]', '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600"]', TRUE),
('Cotton T-Shirt 3-Pack', 'Pack of 3 T-shirts in cotton jersey. Has a round neck and short sleeves.', 24.99, NULL, 2, 120, '["S","M","L","XL","XXL"]', '["White/Black/Grey","Navy/White/Blue","Black/Black/Black"]', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"]', FALSE),
('High-Waist Jeans', 'High-waist jeans in denim. Has a zip fly with a button, front and back pockets.', 59.99, 44.99, 1, 60, '["24","26","28","30","32","34"]', '["Light Denim","Dark Denim","Black"]', '["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600"]', TRUE),
('Canvas Sneakers', 'Low-top sneakers in cotton canvas. Rubber soles with a herringbone-patterned grip.', 34.99, NULL, 2, 45, '["38","39","40","41","42","43","44","45"]', '["White","Black","Navy"]', '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"]', FALSE),
('Knit Cardigan', 'Long cardigan in a soft knit. Has a V-neck, dropped shoulders, and pockets.', 54.99, 39.99, 1, 40, '["XS","S","M","L","XL"]', '["Cream","Brown","Grey","Green"]', '["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600"]', FALSE),
('Leather Belt', 'Belt in vegetable-tanned leather. Metal buckle with a prong.', 19.99, NULL, 4, 90, '["S","M","L","XL"]', '["Brown","Black","Tan"]', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"]', FALSE),
('Structured Tote Bag', 'Large tote bag in faux leather. Has two handles, zip closure, and inside pockets.', 44.99, NULL, 4, 30, '["One Size"]', '["Black","Camel","White","Brown"]', '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"]', TRUE),
('Kids Denim Jacket', 'Denim jacket for kids with a classic fit. Has a collar and button closure.', 29.99, NULL, 3, 55, '["2-4Y","4-6Y","6-8Y","8-10Y","10-12Y"]', '["Light Denim","Dark Denim"]', '["https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=600"]', FALSE),
('Linen Trousers', 'Relaxed-fit trousers in linen. Elasticated waist with a drawstring.', 44.99, 34.99, 1, 65, '["XS","S","M","L","XL"]', '["White","Beige","Black","Navy"]', '["https://images.unsplash.com/photo-1594938298603-c8148c4b4091?w=600"]', FALSE);

-- Admin user (password: Admin@123)
INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
('Admin', 'E&E', 'admin@ee-fashion.com', '$2b$10$rQZ9uAVn3Xb3N4K8mM7LxeYwBjKpQoR1nZvT6LmD8cA4sH2fG5iJu', 'admin');
