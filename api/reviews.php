<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// GET reviews for a hotel
if ($action === 'get' && $method === 'GET') {
    $hotelId = (int)($_GET['hotel_id'] ?? 0);
    if (!$hotelId) respond(['error' => 'hotel_id required'], 400);

    $db   = getDB();
    $stmt = $db->prepare("
        SELECT R.id, R.rating, R.comment, R.date, U.name AS user_name
        FROM REVIEW R
        JOIN USER U ON R.user_id = U.id
        WHERE R.hotel_id = ?
        ORDER BY R.date DESC, R.id DESC
    ");
    $stmt->execute([$hotelId]);
    respond($stmt->fetchAll());
}

// POST a review
if ($action === 'add' && $method === 'POST') {
    $b       = body();
    $userId  = (int)($b['user_id']  ?? 0);
    $hotelId = (int)($b['hotel_id'] ?? 0);
    $rating  = (int)($b['rating']   ?? 5);
    $comment = trim($b['comment']   ?? '');

    if (!$userId || !$hotelId || !$comment)
        respond(['error' => 'Missing required fields.'], 400);

    $db   = getDB();
    $stmt = $db->prepare("INSERT INTO REVIEW (user_id, hotel_id, rating, comment, date) VALUES (?, ?, ?, ?, CURDATE())");
    $stmt->execute([$userId, $hotelId, $rating, $comment]);
    respond(['success' => true, 'id' => (int)$db->lastInsertId()]);
}

respond(['error' => 'Invalid request.'], 400);
