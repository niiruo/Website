-- =============================================
-- Hotel Tracker Database Setup
-- Run this in phpMyAdmin > Import
-- =============================================

CREATE DATABASE IF NOT EXISTS hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_db;

CREATE TABLE IF NOT EXISTS USER (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DESTINATION (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS HOTEL (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    address        VARCHAR(500),
    city           VARCHAR(255),
    rating         FLOAT DEFAULT 0,
    description    TEXT,
    price_per_night DECIMAL(10,2),
    destination_id INT,
    FOREIGN KEY (destination_id) REFERENCES DESTINATION(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS REVIEW (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id  INT NOT NULL,
    hotel_id INT NOT NULL,
    rating   INT DEFAULT 5,
    comment  TEXT,
    date     DATE NOT NULL,
    FOREIGN KEY (user_id)  REFERENCES USER(id)  ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES HOTEL(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AMENITY (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS HOTELAMENITY (
    hotel_id   INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (hotel_id, amenity_id),
    FOREIGN KEY (hotel_id)   REFERENCES HOTEL(id)   ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES AMENITY(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HOTELIMAGE (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id  INT NOT NULL,
    image_url VARCHAR(1000),
    FOREIGN KEY (hotel_id) REFERENCES HOTEL(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS OFFER (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id    INT NOT NULL,
    description TEXT,
    FOREIGN KEY (hotel_id) REFERENCES HOTEL(id) ON DELETE CASCADE
);
