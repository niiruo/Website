<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// REGISTER
if ($action === 'register' && $method === 'POST') {
    $b     = body();
    $name  = trim($b['name'] ?? '');
    $email = trim($b['email'] ?? '');
    $pass  = $b['password'] ?? '';

    if (!$name || !$email || !$pass)
        respond(['error' => 'All fields are required.'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        respond(['error' => 'Invalid email address.'], 400);
    if (strlen($pass) < 6)
        respond(['error' => 'Password must be at least 6 characters.'], 400);

    $db = getDB();
    $chk = $db->prepare("SELECT id FROM USER WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) respond(['error' => 'Email already registered.'], 409);

    $stmt = $db->prepare("INSERT INTO USER (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, password_hash($pass, PASSWORD_BCRYPT)]);

    respond(['success' => true, 'message' => 'Registered successfully!']);
}

// LOGIN
if ($action === 'login' && $method === 'POST') {
    $b     = body();
    $email = trim($b['email'] ?? '');
    $pass  = $b['password'] ?? '';

    if (!$email || !$pass)
        respond(['error' => 'Email and password are required.'], 400);

    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM USER WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password']))
        respond(['error' => 'Invalid email or password.'], 401);

    respond([
        'success' => true,
        'user'    => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email']]
    ]);
}

// RESET PASSWORD
if ($action === 'reset' && $method === 'POST') {
    $b     = body();
    $email = trim($b['email'] ?? '');
    $pass  = $b['password'] ?? '';

    if (!$email || !$pass) respond(['error' => 'All fields required.'], 400);

    $db   = getDB();
    $stmt = $db->prepare("SELECT id FROM USER WHERE email = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) respond(['error' => 'Email not found.'], 404);

    $upd = $db->prepare("UPDATE USER SET password = ? WHERE email = ?");
    $upd->execute([password_hash($pass, PASSWORD_BCRYPT), $email]);
    respond(['success' => true, 'message' => 'Password updated!']);
}

respond(['error' => 'Invalid request.'], 400);
