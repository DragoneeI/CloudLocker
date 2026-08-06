-- ==========================================
-- CloudLocker - Seed Data
-- ==========================================

-- ------------------------------------------
-- Admin Account
-- Password: admin123 (replace with a hashed
-- password once authentication is implemented)
-- ------------------------------------------

INSERT INTO admins (username, password_hash)
VALUES
('admin', 'admin123');


-- ------------------------------------------
-- Lockers
-- ------------------------------------------

INSERT INTO lockers (locker_name)
VALUES
('L001'),
('L002'),
('L003'),
('L004'),
('L005'),
('L006'),
('L007'),
('L008'),
('L009'),
('L010');


-- ------------------------------------------
-- Demo Users
-- ------------------------------------------

INSERT INTO users (full_name, email, face_image)
VALUES
('Rahhal Makki',      'rahhal.ce@gmail.com',      NULL),
('Ahmed Alharbi',     'ahmed@example.com',        NULL),
('Mohammed Ali',      'mohammed@example.com',     NULL),
('Sara Alotaibi',     'sara@example.com',         NULL),
('Fatimah Alqahtani', 'fatimah@example.com',      NULL);

-- ------------------------------------------
-- Reservations
-- Leave empty for testing
-- ------------------------------------------


-- ------------------------------------------
-- Access Logs
-- Leave empty
-- ------------------------------------------
