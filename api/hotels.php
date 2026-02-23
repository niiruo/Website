<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'OPTIONS') { jsonResponse(['ok' => true]); }

// GET all hotels
if ($action === 'list' && $method === 'GET') {
    $pdo = getConnection();
    $hotels = $pdo->query("
        SELECT H.*, D.name AS destination_name
        FROM HOTEL H
        LEFT JOIN DESTINATION D ON H.destination_id = D.id
        ORDER BY H.name
    ")->fetchAll();

    // Attach amenities and images to each hotel
    foreach ($hotels as &$hotel) {
        $aid = $pdo->prepare("SELECT A.name FROM AMENITY A JOIN HOTELAMENITY HA ON A.id = HA.amenity_id WHERE HA.hotel_id = ?");
        $aid->execute([$hotel['id']]);
        $hotel['amenities'] = array_column($aid->fetchAll(), 'name');

        $img = $pdo->prepare("SELECT image_url FROM HOTELIMAGE WHERE hotel_id = ?");
        $img->execute([$hotel['id']]);
        $hotel['images'] = array_column($img->fetchAll(), 'image_url');

        $offers = $pdo->prepare("SELECT description FROM OFFER WHERE hotel_id = ?");
        $offers->execute([$hotel['id']]);
        $hotel['offers'] = array_column($offers->fetchAll(), 'description');
    }

    jsonResponse($hotels);
}

jsonResponse(['error' => 'Invalid request'], 400);
