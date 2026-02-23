<?php
header('Content-Type: application/json');
$pdo = new PDO("mysql:host=localhost;dbname=hotel_db", "root", "");

$stmt = $pdo->query("SELECT * FROM HOTEL");
$hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($hotels as $h) {
    $id = $h['id'];
    
    // Get Sub Images from the HOTELIMAGE table
    $imgStmt = $pdo->prepare("SELECT image_url FROM HOTELIMAGE WHERE hotel_id = ?");
    $imgStmt->execute([$id]);
    $subs = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

    // Get Amenities from the HOTELAMENITY join table
    $amStmt = $pdo->prepare("SELECT a.name FROM AMENITY a JOIN HOTELAMENITY ha ON a.id = ha.amenity_id WHERE ha.hotel_id = ?");
    $amStmt->execute([$id]);
    $amenities = $amStmt->fetchAll(PDO::FETCH_COLUMN);

    $result[] = [
        "id" => (int)$id,
        "name" => $h['name'],
        "location" => $h['city'],
        "price" => (float)$h['price_per_night'],
        "description" => $h['description'],
        "rating" => (int)$h['rating'],
        "image" => "pictures/" . $h['name'] . ".jpg", // Default main image naming
        "subImages" => array_map(fn($img) => "pictures/" . $img, $subs),
        "amenities" => $amenities
    ];
}
echo json_encode($result);
?>